import { spawnSync } from "node:child_process";
import path from "node:path";

describe("agw cli", () => {
  it("emits only a JSON error envelope on stderr for failures", () => {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", path.join(process.cwd(), "packages/agw-cli/src/index.ts"), "schema", "missing.command"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");

    const envelope = JSON.parse(result.stderr);
    expect(result.stderr).toBe(`${JSON.stringify(envelope, null, 2)}\n`);
    expect(envelope).toEqual({
      error: {
        code: "SCHEMA_NOT_FOUND",
        details: undefined,
        message: "Unknown command schema: missing.command",
      },
    });
  });
});
