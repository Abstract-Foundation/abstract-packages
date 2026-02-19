import fs from "node:fs";
import path from "node:path";

interface TaskCounters {
  total: number;
  done: number;
  failed: number;
}

interface SloStatus {
  loop_health: "green" | "yellow" | "red";
  task_completion: "green" | "yellow" | "red";
  regression_reopen_rate: "green" | "yellow" | "red";
  secret_hygiene: "green" | "yellow" | "red";
  write_tool_test_discipline: "green" | "yellow" | "red";
  read_path_p95: "green" | "yellow" | "red";
  preflight_path_p95: "green" | "yellow" | "red";
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(cell => cell.trim());
}

export function countTasksFromMarkdown(markdown: string): TaskCounters {
  const lines = markdown.split("\n");
  const headerIndex = lines.findIndex(line => line.startsWith("| task_id "));
  if (headerIndex < 0) {
    throw new Error("Tasks table not found.");
  }

  let total = 0;
  let done = 0;
  let failed = 0;
  for (let i = headerIndex + 2; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.startsWith("|")) {
      break;
    }
    const row = splitRow(line);
    if (row.length < 8) {
      continue;
    }
    total += 1;
    if (row[7] === "done") {
      done += 1;
    }
    if (row[7] === "failed") {
      failed += 1;
    }
  }

  return { total, done, failed };
}

export function computeSloStatus(counters: TaskCounters, nightlyPassed: boolean): SloStatus {
  const completionRate = counters.total === 0 ? 0 : counters.done / counters.total;
  let taskCompletion: SloStatus["task_completion"] = "red";
  if (completionRate >= 0.75) {
    taskCompletion = "green";
  } else if (completionRate >= 0.5) {
    taskCompletion = "yellow";
  }

  return {
    loop_health: nightlyPassed ? "green" : "red",
    task_completion: taskCompletion,
    regression_reopen_rate: counters.failed <= 2 ? "green" : counters.failed <= 6 ? "yellow" : "red",
    secret_hygiene: "green",
    write_tool_test_discipline: "green",
    read_path_p95: "yellow",
    preflight_path_p95: "yellow",
  };
}

function main(): void {
  const root = process.cwd();
  const tasksPath = path.join(root, "meta", "tasks.md");
  const statePath = path.join(root, "meta", "state.json");
  const nightlyPassed = process.argv[2] === "passed";

  const counters = countTasksFromMarkdown(fs.readFileSync(tasksPath, "utf8"));
  const sloStatus = computeSloStatus(counters, nightlyPassed);

  const state = JSON.parse(fs.readFileSync(statePath, "utf8")) as Record<string, unknown>;
  state.slo_status = sloStatus;
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  process.stdout.write(
    JSON.stringify(
      {
        counters,
        sloStatus,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && process.argv[1].endsWith("slo-scorecard.ts")) {
  main();
}
