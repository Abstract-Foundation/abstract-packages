import fs from "node:fs";
import path from "node:path";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("shipped agent guidance", () => {
  it("ships a top-level CONTEXT.md with runtime-first rules", () => {
    const context = read("CONTEXT.md");

    expect(context).toContain("agw-cli schema <commandId>");
    expect(context).toContain("--dry-run");
    expect(context).toContain("AGW_HOME");
    expect(context).toContain("AGW_OUTPUT");
    expect(context).toContain("AGW_SANITIZE_PROFILE");
  });

  it("keeps first-party skills aligned with dry-run/execute guidance", () => {
    const authSkill = read("packages/agw-cli/skills/authenticating-with-agw/SKILL.md");
    const txSkill = read("packages/agw-cli/skills/executing-agw-transactions/SKILL.md");

    expect(authSkill).toContain("--dry-run");
    expect(authSkill).toContain("--execute");
    expect(txSkill).toContain("--dry-run");
    expect(txSkill).toContain("--execute");
    expect(txSkill).not.toContain('"execute": true');
  });
});
