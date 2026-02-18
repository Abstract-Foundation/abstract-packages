import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const LOOP_TABLE_HEADER = [
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
  dependencies?: string;
}

function createTasksMarkdown(tasks: FixtureTask[]): string {
  const lines = ["# Engineering Backlog", "", "| " + LOOP_TABLE_HEADER.join(" | ") + " |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"];
  for (const task of tasks) {
    lines.push(
      `| ${task.task_id} | objective | scope_in | scope_out | files | tests | acceptance | ${task.status} | unassigned | ${
        task.dependencies ?? "-"
      } |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

function createFixture(tasksMarkdown: string): string {
  const repoRoot = path.resolve(__dirname, "..");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-loop-sync-"));

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
      "  run_template: 'codex exec --model \"{model}\" --cd \"{repoRoot}\" {prompt}'",
      "loop:",
      "  max_iterations_per_run: 1",
      "  sleep_seconds_between_iterations: 0",
      "  retry_failed_tasks: true",
      "quality_gates:",
      "  command: echo quality-gate",
      "memory:",
      "  tasks_file: meta/tasks.md",
      "  progress_file: meta/progress.md",
      "  state_file: meta/state.json",
      "",
    ].join("\n"),
    "utf8",
  );

  fs.writeFileSync(path.join(tmpDir, "meta", "prompts", "builder.md"), "# Builder Prompt\n", "utf8");
  fs.writeFileSync(path.join(tmpDir, "meta", "tasks.md"), tasksMarkdown, "utf8");
  fs.writeFileSync(path.join(tmpDir, "meta", "progress.md"), "# Loop Progress Log\n", "utf8");
  fs.writeFileSync(
    path.join(tmpDir, "meta", "state.json"),
    JSON.stringify(
      {
        version: 1,
        last_updated: "2000-01-01T00:00:00Z",
        next_task: "STALE-TASK",
        autonomy: {},
        product: {},
        slo_status: {},
        counters: {
          tasks_total: 0,
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

  return tmpDir;
}

function runLoopDryOnce(tmpDir: string): void {
  const repoRoot = path.resolve(__dirname, "..");
  const tsxBin = path.join(repoRoot, "node_modules", ".bin", "tsx");

  fs.mkdirSync("/tmp/agw-mcp-loop", { recursive: true });

  execFileSync(tsxBin, ["scripts/agent-loop.ts", "--dry-run", "--once"], {
    cwd: tmpDir,
    stdio: "pipe",
    env: process.env,
  });
}

function readState(tmpDir: string): {
  next_task: string;
  counters: {
    tasks_total: number;
    tasks_ready: number;
    tasks_in_progress: number;
    tasks_done: number;
    tasks_failed: number;
    tasks_blocked: number;
  };
} {
  return JSON.parse(fs.readFileSync(path.join(tmpDir, "meta", "state.json"), "utf8")) as {
    next_task: string;
    counters: {
      tasks_total: number;
      tasks_ready: number;
      tasks_in_progress: number;
      tasks_done: number;
      tasks_failed: number;
      tasks_blocked: number;
    };
  };
}

describe("agent-loop state sync", () => {
  it("syncs counters and next_task from the markdown tasks table", () => {
    const tmpDir = createFixture(
      createTasksMarkdown([
        { task_id: "AGW-100", status: "ready", dependencies: "-" },
        { task_id: "AGW-101", status: "ready", dependencies: "AGW-999" },
        { task_id: "AGW-102", status: "done", dependencies: "-" },
        { task_id: "AGW-103", status: "failed", dependencies: "-" },
        { task_id: "AGW-104", status: "blocked", dependencies: "-" },
        { task_id: "AGW-105", status: "backlog", dependencies: "-" },
      ]),
    );

    try {
      runLoopDryOnce(tmpDir);

      const state = readState(tmpDir);
      expect(state.next_task).toBe("AGW-100");
      expect(state.counters).toEqual({
        tasks_total: 6,
        tasks_ready: 2,
        tasks_in_progress: 0,
        tasks_done: 1,
        tasks_failed: 1,
        tasks_blocked: 1,
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("keeps state counters in sync when no runnable task exists", () => {
    const tmpDir = createFixture(
      createTasksMarkdown([
        { task_id: "AGW-200", status: "done", dependencies: "-" },
        { task_id: "AGW-201", status: "blocked", dependencies: "-" },
        { task_id: "AGW-202", status: "backlog", dependencies: "-" },
      ]),
    );

    try {
      runLoopDryOnce(tmpDir);

      const state = readState(tmpDir);
      expect(state.next_task).toBe("-");
      expect(state.counters).toEqual({
        tasks_total: 3,
        tasks_ready: 0,
        tasks_in_progress: 0,
        tasks_done: 1,
        tasks_failed: 0,
        tasks_blocked: 1,
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
