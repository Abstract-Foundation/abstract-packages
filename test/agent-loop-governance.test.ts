import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TABLE_HEADER = [
  "task_id",
  "objective",
  "scope_in",
  "scope_out",
  "files",
  "tests_required",
  "acceptance",
  "status",
  "owner_agent",
  "dependencies",
];

interface FixtureTask {
  task_id: string;
  status: string;
  tests_required: string;
  objective?: string;
  dependencies?: string;
}

function createTasksMarkdown(tasks: FixtureTask[]): string {
  const lines = ["# Engineering Backlog", "", `| ${TABLE_HEADER.join(" | ")} |`, "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"];
  for (const task of tasks) {
    lines.push(
      `| ${task.task_id} | ${task.objective ?? "objective"} | scope_in | scope_out | files | ${task.tests_required} | acceptance | ${task.status} | unassigned | ${
        task.dependencies ?? "-"
      } |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

function createFixture(options: {
  tasks: FixtureTask[];
  runTemplate: string;
  qualityCommand: string;
  requirePrivateRemote: boolean;
}): string {
  const repoRoot = path.resolve(__dirname, "..");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-loop-governance-"));

  fs.mkdirSync(path.join(tmpDir, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "meta", "prompts"), { recursive: true });
  fs.symlinkSync(path.join(repoRoot, "node_modules"), path.join(tmpDir, "node_modules"), "dir");
  fs.copyFileSync(path.join(repoRoot, "scripts", "agent-loop.ts"), path.join(tmpDir, "scripts", "agent-loop.ts"));

  fs.writeFileSync(
    path.join(tmpDir, "meta", "loop-config.yaml"),
    [
      "version: 1",
      "autonomy:",
      "  lock_file: .agent-loop.lock",
      "codex:",
      "  command: codex",
      "  model: gpt-5.3-codex",
      `  run_template: '${options.runTemplate}'`,
      "loop:",
      "  max_iterations_per_run: 1",
      "  sleep_seconds_between_iterations: 0",
      "  retry_failed_tasks: true",
      "quality_gates:",
      `  command: ${options.qualityCommand}`,
      "git:",
      "  commit_after_task: true",
      "  push_after_commit: true",
      `  require_private_remote: ${options.requirePrivateRemote}`,
      '  commit_message_template: "task({task_id}): {objective}"',
      "memory:",
      "  tasks_file: meta/tasks.md",
      "  progress_file: meta/progress.md",
      "  state_file: meta/state.json",
      "",
    ].join("\n"),
    "utf8",
  );

  fs.writeFileSync(path.join(tmpDir, "meta", "prompts", "builder.md"), "# Builder Prompt\n", "utf8");
  fs.writeFileSync(path.join(tmpDir, "meta", "tasks.md"), createTasksMarkdown(options.tasks), "utf8");
  fs.writeFileSync(path.join(tmpDir, "meta", "progress.md"), "# Loop Progress Log\n", "utf8");
  fs.writeFileSync(
    path.join(tmpDir, "meta", "state.json"),
    JSON.stringify(
      {
        version: 1,
        last_updated: "2000-01-01T00:00:00Z",
        next_task: "-",
        autonomy: {},
        product: {},
        slo_status: {},
        counters: {
          tasks_total: options.tasks.length,
          tasks_ready: 0,
          tasks_in_progress: 0,
          tasks_done: 0,
          tasks_failed: 0,
          tasks_blocked: 0,
        },
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  fs.mkdirSync("/tmp/agw-mcp-loop", { recursive: true });
  return tmpDir;
}

function runLoop(tmpDir: string, args: string[]): void {
  const repoRoot = path.resolve(__dirname, "..");
  const tsxBin = path.join(repoRoot, "node_modules", ".bin", "tsx");
  execFileSync(tsxBin, ["scripts/agent-loop.ts", ...args], {
    cwd: tmpDir,
    stdio: "pipe",
    env: process.env,
  });
}

function parseTaskStatus(tasksMarkdown: string, taskId: string): string {
  const lines = tasksMarkdown.split("\n");
  const headerIndex = lines.findIndex(line => line.includes("| task_id |"));
  if (headerIndex < 0) {
    throw new Error("Missing tasks header");
  }

  const header = lines[headerIndex]
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(cell => cell.trim());
  const statusIndex = header.findIndex(cell => cell === "status");
  const taskIdIndex = header.findIndex(cell => cell === "task_id");
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith("|")) {
      break;
    }
    const cols = line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map(cell => cell.trim());
    if (cols[taskIdIndex] === taskId) {
      return cols[statusIndex] ?? "";
    }
  }

  throw new Error(`Task not found: ${taskId}`);
}

describe("agent-loop governance", () => {
  it("blocks tasks that do not define meaningful tests_required criteria", () => {
    const tmpDir = createFixture({
      tasks: [{ task_id: "AGW-300", status: "ready", tests_required: "-" }],
      runTemplate: "true",
      qualityCommand: "echo quality-ok",
      requirePrivateRemote: false,
    });

    try {
      runLoop(tmpDir, ["--dry-run", "--once"]);
      const tasksText = fs.readFileSync(path.join(tmpDir, "meta", "tasks.md"), "utf8");
      const progressText = fs.readFileSync(path.join(tmpDir, "meta", "progress.md"), "utf8");
      expect(parseTaskStatus(tasksText, "AGW-300")).toBe("blocked");
      expect(progressText).toContain("Missing meaningful `tests_required` success criteria");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("commits and pushes after quality gates pass", () => {
    const tmpDir = createFixture({
      tasks: [{ task_id: "AGW-301", status: "ready", tests_required: "unit + integration tests", objective: "implement wallet feature" }],
      runTemplate: "true",
      qualityCommand: "echo quality-ok",
      requirePrivateRemote: false,
    });
    const remoteDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-loop-remote-"));
    const bareRemotePath = path.join(remoteDir, "origin.git");

    try {
      execFileSync("git", ["init", "-b", "main"], { cwd: tmpDir, stdio: "pipe" });
      execFileSync("git", ["config", "user.email", "loop@test.local"], { cwd: tmpDir, stdio: "pipe" });
      execFileSync("git", ["config", "user.name", "Loop Bot"], { cwd: tmpDir, stdio: "pipe" });
      execFileSync("git", ["add", "-A"], { cwd: tmpDir, stdio: "pipe" });
      execFileSync("git", ["commit", "-m", "init"], { cwd: tmpDir, stdio: "pipe" });

      execFileSync("git", ["init", "--bare", bareRemotePath], { cwd: tmpDir, stdio: "pipe" });
      execFileSync("git", ["remote", "add", "origin", bareRemotePath], { cwd: tmpDir, stdio: "pipe" });
      execFileSync("git", ["push", "-u", "origin", "main"], { cwd: tmpDir, stdio: "pipe" });

      runLoop(tmpDir, ["--once"]);

      const tasksText = fs.readFileSync(path.join(tmpDir, "meta", "tasks.md"), "utf8");
      expect(parseTaskStatus(tasksText, "AGW-301")).toBe("done");

      const commitMessage = execFileSync("git", ["log", "-1", "--pretty=%s"], { cwd: tmpDir, stdio: "pipe" })
        .toString()
        .trim();
      expect(commitMessage).toContain("task(AGW-301):");

      const localHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd: tmpDir, stdio: "pipe" })
        .toString()
        .trim();
      const remoteHead = execFileSync("git", ["--git-dir", bareRemotePath, "rev-parse", "refs/heads/main"], { cwd: tmpDir, stdio: "pipe" })
        .toString()
        .trim();
      expect(remoteHead).toBe(localHead);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      fs.rmSync(remoteDir, { recursive: true, force: true });
    }
  });

  it("fails completion when private remote policy is violated", () => {
    const tmpDir = createFixture({
      tasks: [{ task_id: "AGW-302", status: "ready", tests_required: "unit tests", objective: "enforce private remotes" }],
      runTemplate: "true",
      qualityCommand: "echo quality-ok",
      requirePrivateRemote: true,
    });

    try {
      execFileSync("git", ["init", "-b", "main"], { cwd: tmpDir, stdio: "pipe" });
      execFileSync("git", ["config", "user.email", "loop@test.local"], { cwd: tmpDir, stdio: "pipe" });
      execFileSync("git", ["config", "user.name", "Loop Bot"], { cwd: tmpDir, stdio: "pipe" });
      execFileSync("git", ["add", "-A"], { cwd: tmpDir, stdio: "pipe" });
      execFileSync("git", ["commit", "-m", "init"], { cwd: tmpDir, stdio: "pipe" });
      execFileSync("git", ["remote", "add", "origin", "https://github.com/example/agw-mcp.git"], { cwd: tmpDir, stdio: "pipe" });

      runLoop(tmpDir, ["--once"]);

      const tasksText = fs.readFileSync(path.join(tmpDir, "meta", "tasks.md"), "utf8");
      const progressText = fs.readFileSync(path.join(tmpDir, "meta", "progress.md"), "utf8");
      expect(parseTaskStatus(tasksText, "AGW-302")).toBe("failed");
      expect(progressText).toContain("Origin remote must use SSH for private repos");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
