import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

type TaskStatus = "backlog" | "ready" | "in_progress" | "done" | "failed" | "blocked";

interface TaskRow {
  task_id: string;
  objective: string;
  scope_in: string;
  scope_out: string;
  files: string;
  tests_required: string;
  acceptance: string;
  status: TaskStatus;
  owner_agent: string;
  dependencies: string;
}

interface LoopConfig {
  autonomy: {
    lock_file: string;
  };
  codex: {
    command: string;
    model: string;
    run_template: string;
  };
  loop: {
    max_iterations_per_run: number;
    sleep_seconds_between_iterations: number;
    idle_sleep_seconds_when_empty?: number;
    max_lock_wait_seconds?: number;
    codex_retries_per_task?: number;
    codex_retry_backoff_seconds?: number;
    quality_retries_per_task?: number;
    quality_retry_backoff_seconds?: number;
    retry_failed_tasks: boolean;
  };
  quality_gates: {
    command: string;
  };
  git?: {
    commit_after_task?: boolean;
    push_after_commit?: boolean;
    require_private_remote?: boolean;
    commit_message_template?: string;
  };
  memory: {
    tasks_file: string;
    progress_file: string;
    state_file: string;
  };
}

interface TaskCounters {
  tasks_total: number;
  tasks_ready: number;
  tasks_in_progress: number;
  tasks_done: number;
  tasks_failed: number;
  tasks_blocked: number;
}

interface LoopState {
  version: number;
  last_updated: string;
  next_task: string;
  counters: TaskCounters;
  [key: string]: unknown;
}

interface GitPolicy {
  commit_after_task: boolean;
  push_after_commit: boolean;
  require_private_remote: boolean;
  commit_message_template: string;
}

function getRepoRoot(): string {
  const thisFile = fileURLToPath(import.meta.url);
  const thisDir = path.dirname(thisFile);
  return path.resolve(thisDir, "..");
}

function readConfig(repoRoot: string): LoopConfig {
  const raw = fs.readFileSync(path.join(repoRoot, "meta", "loop-config.yaml"), "utf8");
  return parse(raw) as LoopConfig;
}

function nowIso(): string {
  return new Date().toISOString();
}

function appendProgress(repoRoot: string, config: LoopConfig, heading: string, lines: string[]): void {
  const progressPath = path.join(repoRoot, config.memory.progress_file);
  const block = [`\n## ${nowIso()} - ${heading}`, ...lines.map(line => `- ${line}`), ""].join("\n");
  fs.appendFileSync(progressPath, block, "utf8");
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(cell => cell.trim());
}

function parseTasksTable(text: string): {
  header: string[];
  tasks: TaskRow[];
  startIndex: number;
  endIndex: number;
  lines: string[];
} {
  const lines = text.split("\n");
  const startIndex = lines.findIndex(line => line.trim().startsWith("| task_id "));
  if (startIndex < 0 || startIndex + 1 >= lines.length) {
    throw new Error("Could not find tasks markdown table header");
  }

  const header = splitRow(lines[startIndex]);
  let i = startIndex + 2;
  const tasks: TaskRow[] = [];

  while (i < lines.length && lines[i].trim().startsWith("|")) {
    const cols = splitRow(lines[i]);
    if (cols.length === header.length) {
      const row = Object.fromEntries(header.map((key, idx) => [key, cols[idx]])) as unknown as TaskRow;
      tasks.push(row);
    }
    i += 1;
  }

  return {
    header,
    tasks,
    startIndex,
    endIndex: i - 1,
    lines,
  };
}

function stringifyTasksTable(header: string[], tasks: TaskRow[]): string[] {
  const rows: string[] = [];
  rows.push(`| ${header.join(" | ")} |`);
  rows.push(`| ${header.map(() => "---").join(" | ")} |`);
  for (const task of tasks) {
    rows.push(`| ${header.map(key => (task as unknown as Record<string, string>)[key] ?? "").join(" | ")} |`);
  }
  return rows;
}

function countTaskStatuses(tasks: TaskRow[]): TaskCounters {
  const counters: TaskCounters = {
    tasks_total: tasks.length,
    tasks_ready: 0,
    tasks_in_progress: 0,
    tasks_done: 0,
    tasks_failed: 0,
    tasks_blocked: 0,
  };

  for (const task of tasks) {
    if (task.status === "ready") {
      counters.tasks_ready += 1;
    } else if (task.status === "in_progress") {
      counters.tasks_in_progress += 1;
    } else if (task.status === "done") {
      counters.tasks_done += 1;
    } else if (task.status === "failed") {
      counters.tasks_failed += 1;
    } else if (task.status === "blocked") {
      counters.tasks_blocked += 1;
    }
  }

  return counters;
}

function syncStateFile(repoRoot: string, config: LoopConfig, tasks: TaskRow[]): void {
  const statePath = path.join(repoRoot, config.memory.state_file);
  const raw = fs.readFileSync(statePath, "utf8");
  const state = JSON.parse(raw) as LoopState;
  const nextTask = pickTask(tasks, config.loop.retry_failed_tasks);

  const nextState: LoopState = {
    ...state,
    last_updated: nowIso(),
    next_task: nextTask?.task_id ?? "-",
    counters: countTaskStatuses(tasks),
  };

  fs.writeFileSync(statePath, `${JSON.stringify(nextState, null, 2)}\n`, "utf8");
}

function writeTasks(repoRoot: string, config: LoopConfig, parsed: ReturnType<typeof parseTasksTable>): void {
  const tasksPath = path.join(repoRoot, config.memory.tasks_file);
  const outLines = [...parsed.lines];
  const newTable = stringifyTasksTable(parsed.header, parsed.tasks);
  outLines.splice(parsed.startIndex, parsed.endIndex - parsed.startIndex + 1, ...newTable);
  fs.writeFileSync(tasksPath, outLines.join("\n"), "utf8");
  syncStateFile(repoRoot, config, parsed.tasks);
}

function dependenciesDone(task: TaskRow, tasks: TaskRow[]): boolean {
  const deps = task.dependencies.trim();
  if (!deps || deps === "-") {
    return true;
  }

  const depIds = deps
    .split(",")
    .map(dep => dep.trim())
    .filter(Boolean);

  return depIds.every(depId => tasks.some(taskRow => taskRow.task_id === depId && taskRow.status === "done"));
}

function pickTask(tasks: TaskRow[], retryFailed: boolean): TaskRow | null {
  const inProgress = tasks.find(task => task.status === "in_progress" && dependenciesDone(task, tasks));
  if (inProgress) {
    return inProgress;
  }

  const ready = tasks.find(task => task.status === "ready" && dependenciesDone(task, tasks));
  if (ready) {
    return ready;
  }

  if (retryFailed) {
    const failed = tasks.find(task => task.status === "failed" && dependenciesDone(task, tasks));
    if (failed) {
      return failed;
    }
  }

  return null;
}

function buildTaskPrompt(repoRoot: string, task: TaskRow): string {
  const base = fs.readFileSync(path.join(repoRoot, "meta", "prompts", "builder.md"), "utf8");
  return [
    base,
    "",
    "## Assigned Task",
    `- task_id: ${task.task_id}`,
    `- objective: ${task.objective}`,
    `- scope_in: ${task.scope_in}`,
    `- scope_out: ${task.scope_out}`,
    `- files: ${task.files}`,
    `- tests_required: ${task.tests_required}`,
    `- acceptance: ${task.acceptance}`,
    "",
    "## Required Memory Files",
    "- meta/product.md",
    "- meta/prd.md",
    "- meta/decisions.md",
    "- meta/tasks.md",
    "- meta/test-strategy.md",
    "- meta/risks.md",
    "- meta/progress.md",
  ].join("\n");
}

function shellQuote(value: string): string {
  return "'" + value.replaceAll("'", "'\"'\"'") + "'";
}

function runCommand(command: string, cwd: string): void {
  execSync(command, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
}

function runCommandCapture(command: string, cwd: string): string {
  return execSync(command, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  })
    .toString()
    .trim();
}

function getGitPolicy(config: LoopConfig): GitPolicy {
  return {
    commit_after_task: config.git?.commit_after_task ?? true,
    push_after_commit: config.git?.push_after_commit ?? true,
    require_private_remote: config.git?.require_private_remote ?? true,
    commit_message_template: config.git?.commit_message_template ?? "task({task_id}): {objective}",
  };
}

function hasMeaningfulTestCriteria(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "-" || normalized === "n/a" || normalized === "none") {
    return false;
  }

  return !normalized.includes("tbd");
}

function buildCommitMessage(template: string, task: TaskRow): string {
  const objective = task.objective.replace(/\s+/g, " ").trim();
  const message = template.replaceAll("{task_id}", task.task_id).replaceAll("{objective}", objective);
  return message.length > 180 ? `${message.slice(0, 177)}...` : message;
}

function hasStagedChanges(repoRoot: string): boolean {
  try {
    runCommandCapture("git diff --cached --quiet", repoRoot);
    return false;
  } catch {
    return true;
  }
}

function assertPrivateRemoteIfRequired(repoRoot: string, policy: GitPolicy): void {
  if (!policy.require_private_remote) {
    return;
  }

  const remoteUrl = runCommandCapture("git remote get-url origin", repoRoot);
  if (!remoteUrl) {
    throw new Error("Missing git origin remote; refusing to push.");
  }

  const isGithubHttps = /^https:\/\/github\.com\//.test(remoteUrl);
  if (isGithubHttps) {
    throw new Error(`Origin remote must use SSH for private repos. Current remote: ${remoteUrl}`);
  }
}

function commitAndPushTask(repoRoot: string, task: TaskRow, config: LoopConfig): string {
  const policy = getGitPolicy(config);
  if (!policy.commit_after_task) {
    return "-";
  }

  assertPrivateRemoteIfRequired(repoRoot, policy);
  runCommand("git add -A", repoRoot);
  if (!hasStagedChanges(repoRoot)) {
    throw new Error(`No changes staged for ${task.task_id}; refusing to mark task complete.`);
  }

  const commitMessage = buildCommitMessage(policy.commit_message_template, task);
  runCommand(`git commit -m ${shellQuote(commitMessage)}`, repoRoot);
  const commitSha = runCommandCapture("git rev-parse --short HEAD", repoRoot);

  if (policy.push_after_commit) {
    runCommand("git push", repoRoot);
  }

  return commitSha;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readLockPid(lockPath: string): number | null {
  try {
    const raw = fs.readFileSync(lockPath, "utf8").trim();
    const pid = Number.parseInt(raw, 10);
    if (!Number.isInteger(pid) || pid <= 0) {
      return null;
    }
    return pid;
  } catch {
    return null;
  }
}

function isPidRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "EPERM") {
      return true;
    }
    return false;
  }
}

async function acquireLoopLock(lockPath: string, maxWaitSeconds: number): Promise<number> {
  const start = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const lockFd = fs.openSync(lockPath, "wx");
      fs.writeFileSync(lockFd, `${process.pid}\n`, "utf8");
      return lockFd;
    } catch {
      const lockPid = readLockPid(lockPath);
      const lockIsStale = lockPid === null || !isPidRunning(lockPid);

      if (lockIsStale) {
        fs.rmSync(lockPath, { force: true });
        continue;
      }

      const waitedSeconds = Math.floor((Date.now() - start) / 1000);
      if (waitedSeconds >= maxWaitSeconds) {
        throw new Error(
          `Lock file exists at ${lockPath} (pid ${lockPid}). Waited ${waitedSeconds}s for lock; exiting.`,
        );
      }

      process.stderr.write(
        `[loop] waiting for lock ${lockPath} held by pid=${lockPid} (${waitedSeconds + 1}/${maxWaitSeconds}s)\n`,
      );
      await sleep(1000);
    }
  }
}

function parseArgs(): { once: boolean; dryRun: boolean; maxIterations?: number } {
  const args = process.argv.slice(2);
  const once = args.includes("--once");
  const dryRun = args.includes("--dry-run");
  const maxArg = args.find(arg => arg.startsWith("--max-iterations="));
  const maxIterations = maxArg ? Number.parseInt(maxArg.split("=")[1] ?? "", 10) : undefined;

  return {
    once,
    dryRun,
    maxIterations: Number.isFinite(maxIterations) ? maxIterations : undefined,
  };
}

async function main(): Promise<void> {
  const repoRoot = getRepoRoot();
  const args = parseArgs();
  const config = readConfig(repoRoot);
  const lockPath = path.join(repoRoot, config.autonomy.lock_file);
  const maxLockWaitSeconds = Math.max(0, config.loop.max_lock_wait_seconds ?? 120);
  const codexRetries = Math.max(1, config.loop.codex_retries_per_task ?? 2);
  const codexRetryBackoffMs = Math.max(0, config.loop.codex_retry_backoff_seconds ?? 10) * 1000;
  const qualityRetries = Math.max(1, config.loop.quality_retries_per_task ?? 2);
  const qualityRetryBackoffMs = Math.max(0, config.loop.quality_retry_backoff_seconds ?? 5) * 1000;
  const idleSleepMs =
    Math.max(0, config.loop.idle_sleep_seconds_when_empty ?? config.loop.sleep_seconds_between_iterations ?? 3) * 1000;

  const lockFd = await acquireLoopLock(lockPath, maxLockWaitSeconds);

  try {
    const maxIterations = args.maxIterations ?? (args.once ? 1 : config.loop.max_iterations_per_run);

    for (let i = 0; i < maxIterations; i += 1) {
      const tasksPath = path.join(repoRoot, config.memory.tasks_file);
      const parsed = parseTasksTable(fs.readFileSync(tasksPath, "utf8"));
      syncStateFile(repoRoot, config, parsed.tasks);
      const task = pickTask(parsed.tasks, config.loop.retry_failed_tasks);

      if (!task) {
        appendProgress(repoRoot, config, "Loop idle", ["No ready/in-progress task found."]);
        if (args.once) {
          break;
        }
        await sleep(idleSleepMs);
        continue;
      }

      if (!hasMeaningfulTestCriteria(task.tests_required)) {
        task.status = "blocked";
        writeTasks(repoRoot, config, parsed);
        appendProgress(repoRoot, config, `Task blocked ${task.task_id}`, [
          "Missing meaningful `tests_required` success criteria. Update `meta/tasks.md` before execution.",
        ]);
        if (args.once) {
          break;
        }
        await sleep(config.loop.sleep_seconds_between_iterations * 1000);
        continue;
      }

      if (task.status !== "in_progress") {
        task.status = "in_progress";
      }
      task.owner_agent = "codex-5.3-high";
      writeTasks(repoRoot, config, parsed);

      appendProgress(repoRoot, config, `Task start ${task.task_id}`, [task.objective]);

      const promptText = buildTaskPrompt(repoRoot, task);
      const promptFile = path.join("/tmp/agw-mcp-loop", `${task.task_id}-${Date.now()}.md`);
      fs.writeFileSync(promptFile, promptText, "utf8");

      if (args.dryRun) {
        appendProgress(repoRoot, config, `Task dry-run ${task.task_id}`, ["Dry run mode, skipping Codex and quality gates."]);
        task.status = "ready";
        writeTasks(repoRoot, config, parsed);
        break;
      }

      const codexCommand = config.codex.run_template
        .replaceAll("{model}", config.codex.model)
        .replaceAll("{repoRoot}", repoRoot)
        .replaceAll("{promptFile}", promptFile)
        .replaceAll("{prompt}", shellQuote(promptText));

      let codexSuccess = false;
      let codexError: unknown = null;
      process.stderr.write(`[loop] task=${task.task_id}\n`);
      process.stderr.write(`[loop] codex=${codexCommand}\n`);
      for (let attempt = 1; attempt <= codexRetries; attempt += 1) {
        try {
          runCommand(codexCommand, repoRoot);
          codexSuccess = true;
          break;
        } catch (error) {
          codexError = error;
          if (attempt < codexRetries) {
            appendProgress(repoRoot, config, `Task codex retry ${task.task_id}`, [
              `Attempt ${attempt}/${codexRetries} failed; retrying after backoff.`,
              `Error: ${error instanceof Error ? error.message : String(error)}`,
            ]);
            await sleep(codexRetryBackoffMs);
          }
        }
      }

      if (!codexSuccess) {
        task.status = "failed";
        writeTasks(repoRoot, config, parsed);
        appendProgress(repoRoot, config, `Task codex failed ${task.task_id}`, [
          `Command: ${codexCommand}`,
          `Attempts: ${codexRetries}`,
          `Error: ${codexError instanceof Error ? codexError.message : String(codexError)}`,
        ]);
      }

      if (codexSuccess) {
        let qualityPassed = false;
        let qualityError: unknown = null;

        for (let attempt = 1; attempt <= qualityRetries; attempt += 1) {
          try {
            runCommand(config.quality_gates.command, repoRoot);
            qualityPassed = true;
            break;
          } catch (error) {
            qualityError = error;
            if (attempt < qualityRetries) {
              appendProgress(repoRoot, config, `Task quality retry ${task.task_id}`, [
                `Quality gate attempt ${attempt}/${qualityRetries} failed; retrying after backoff.`,
                `Error: ${error instanceof Error ? error.message : String(error)}`,
              ]);
              await sleep(qualityRetryBackoffMs);
            }
          }
        }

        if (!qualityPassed) {
          task.status = "failed";
          writeTasks(repoRoot, config, parsed);
          appendProgress(repoRoot, config, `Task completion failed ${task.task_id}`, [
            `Quality command: ${config.quality_gates.command}`,
            `Attempts: ${qualityRetries}`,
            `Error: ${qualityError instanceof Error ? qualityError.message : String(qualityError)}`,
          ]);
        } else {
        try {
          task.status = "done";
          writeTasks(repoRoot, config, parsed);
          const commitSha = commitAndPushTask(repoRoot, task, config);
          appendProgress(repoRoot, config, `Task done ${task.task_id}`, [
            "Codex execution completed and quality gates passed.",
            `Commit: ${commitSha}`,
          ]);
          } catch (error) {
            task.status = "failed";
            writeTasks(repoRoot, config, parsed);
            appendProgress(repoRoot, config, `Task completion failed ${task.task_id}`, [
              `Quality command: ${config.quality_gates.command}`,
              `Error: ${error instanceof Error ? error.message : String(error)}`,
            ]);
          }
        }
      }

      if (args.once) {
        break;
      }

      await sleep(config.loop.sleep_seconds_between_iterations * 1000);
    }
  } finally {
    try {
      fs.closeSync(lockFd);
    } catch {
      // ignore close errors
    }

    fs.rmSync(lockPath, { force: true });
  }
}

main().catch(error => {
  process.stderr.write(`agent-loop fatal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
