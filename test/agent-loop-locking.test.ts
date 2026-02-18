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

function createFixture(): string {
  const repoRoot = path.resolve(__dirname, "..");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-loop-lock-"));

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
      "  run_template: 'true'",
      "loop:",
      "  max_iterations_per_run: 1",
      "  sleep_seconds_between_iterations: 0",
      "  idle_sleep_seconds_when_empty: 0",
      "  max_lock_wait_seconds: 1",
      "  codex_retries_per_task: 1",
      "  quality_retries_per_task: 1",
      "  retry_failed_tasks: true",
      "quality_gates:",
      "  command: echo quality-ok",
      "git:",
      "  commit_after_task: false",
      "  push_after_commit: false",
      "  require_private_remote: false",
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
  fs.writeFileSync(
    path.join(tmpDir, "meta", "tasks.md"),
    [
      "# Engineering Backlog",
      "",
      `| ${TABLE_HEADER.join(" | ")} |`,
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
      "| AGW-LOCK-01 | objective | scope_in | scope_out | files | unit tests | acceptance | ready | unassigned | - |",
      "",
    ].join("\n"),
    "utf8",
  );
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
          tasks_total: 1,
          tasks_ready: 1,
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

  return tmpDir;
}

function readTaskStatus(tasksText: string): string {
  const line = tasksText
    .split("\n")
    .find(row => row.includes("| AGW-LOCK-01 |"));
  if (!line) {
    throw new Error("Task row not found");
  }
  const cols = line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(cell => cell.trim());
  return cols[7] ?? "";
}

describe("agent-loop lock handling", () => {
  it("recovers from stale lock files and proceeds", () => {
    const tmpDir = createFixture();
    const repoRoot = path.resolve(__dirname, "..");
    const tsxBin = path.join(repoRoot, "node_modules", ".bin", "tsx");

    try {
      fs.writeFileSync(path.join(tmpDir, ".agent-loop.lock"), "999999\n", "utf8");
      execFileSync(tsxBin, ["scripts/agent-loop.ts", "--dry-run", "--once"], {
        cwd: tmpDir,
        stdio: "pipe",
        env: process.env,
      });

      const tasks = fs.readFileSync(path.join(tmpDir, "meta", "tasks.md"), "utf8");
      const progress = fs.readFileSync(path.join(tmpDir, "meta", "progress.md"), "utf8");
      expect(readTaskStatus(tasks)).toBe("ready");
      expect(progress).toContain("Task dry-run AGW-LOCK-01");
      expect(fs.existsSync(path.join(tmpDir, ".agent-loop.lock"))).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
