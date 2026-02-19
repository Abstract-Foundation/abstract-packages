import { computeSloStatus, countTasksFromMarkdown } from "../scripts/slo-scorecard.js";

describe("nightly SLO scorecard", () => {
  it("parses task counters from markdown table", () => {
    const markdown = `
| task_id | objective | scope_in | scope_out | files | tests_required | acceptance | status | owner_agent | dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AGW-001 | x | x | x | x | x | x | done | a | - |
| AGW-002 | x | x | x | x | x | x | failed | a | - |
| AGW-003 | x | x | x | x | x | x | ready | a | - |
`;

    expect(countTasksFromMarkdown(markdown)).toEqual({
      total: 3,
      done: 1,
      failed: 1,
    });
  });

  it("computes deterministic SLO statuses", () => {
    const status = computeSloStatus({ total: 10, done: 8, failed: 1 }, true);
    expect(status).toEqual({
      loop_health: "green",
      task_completion: "green",
      regression_reopen_rate: "green",
      secret_hygiene: "green",
      write_tool_test_discipline: "green",
      read_path_p95: "yellow",
      preflight_path_p95: "yellow",
    });
  });
});
