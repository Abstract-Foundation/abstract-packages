import fs from "node:fs";
import path from "node:path";

function pathExists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

describe("repo hygiene", () => {
  it("removes legacy planning and compatibility artifacts from the working tree", () => {
    expect(pathExists("meta")).toBe(false);
    expect(pathExists("src/index.ts")).toBe(false);
    expect(pathExists("src/server/mcp-server.ts")).toBe(false);
    expect(pathExists("MIGRATION.md")).toBe(false);
    expect(pathExists("CLAUDE.md")).toBe(false);
    expect(pathExists("CHANGELOG.md")).toBe(false);
  });

  it("keeps package build output and duplicated extension skills out of the working tree", () => {
    expect(pathExists("packages/agw-cli/extensions/claude-code/skills")).toBe(false);
  });
});
