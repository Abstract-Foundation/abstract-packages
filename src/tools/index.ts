import { abstractRpcCallTool } from "./abstract-rpc-call.js";
import { getBalancesTool } from "./get-balances.js";
import { getTokenListTool } from "./get-token-list.js";
import { getWalletAddressTool } from "./get-wallet-address.js";
import { portalGetAppTool } from "./portal-get-app.js";
import { portalGetUserProfileTool } from "./portal-get-user-profile.js";
import { portalListAppsTool } from "./portal-list-apps.js";
import { portalListStreamsTool } from "./portal-list-streams.js";
import type { ToolHandler } from "./types.js";

export const publicTools: ToolHandler[] = [
  getWalletAddressTool,
  getBalancesTool,
  getTokenListTool,
  portalListAppsTool,
  portalGetAppTool,
  portalListStreamsTool,
  portalGetUserProfileTool,
  abstractRpcCallTool,
];

const toolMap = new Map(publicTools.map(tool => [tool.name, tool]));

export function getTool(name: string): ToolHandler | undefined {
  return toolMap.get(name);
}
