import { assertToolAllowedByPolicyMeta } from "../policy/meta.js";
import type { ToolContext } from "./types.js";

export function assertToolCapability(
  context: ToolContext,
  toolName: string,
): void {
  assertToolAllowedByPolicyMeta(context.sessionManager.getSession(), toolName);
}
