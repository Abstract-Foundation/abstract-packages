import { abstractRpcCallTool } from "./abstract-rpc-call.js";
import { deployContractTool } from "./deploy-contract.js";
import { getBalancesTool } from "./get-balances.js";
import { getSessionStatusTool } from "./get-session-status.js";
import { getTokenListTool } from "./get-token-list.js";
import { getWalletAddressTool } from "./get-wallet-address.js";
import { portalGetAppTool } from "./portal-get-app.js";
import { portalGetUserProfileTool } from "./portal-get-user-profile.js";
import { portalListAppsTool } from "./portal-list-apps.js";
import { portalListStreamsTool } from "./portal-list-streams.js";
import { previewTransactionTool } from "./preview-transaction.js";
import { revokeSessionTool } from "./revoke-session.js";
import { sendCallsTool } from "./send-calls.js";
import { sendTransactionTool } from "./send-transaction.js";
import { signMessageTool } from "./sign-message.js";
import { signTransactionTool } from "./sign-transaction.js";
import { transferTokenTool } from "./transfer-token.js";
import type { ToolHandler } from "./types.js";
import { writeContractTool } from "./write-contract.js";

export const tools: ToolHandler[] = [
  getWalletAddressTool,
  getBalancesTool,
  getTokenListTool,
  getSessionStatusTool,
  signMessageTool,
  signTransactionTool,
  previewTransactionTool,
  sendTransactionTool,
  sendCallsTool,
  transferTokenTool,
  writeContractTool,
  deployContractTool,
  revokeSessionTool,
  portalListAppsTool,
  portalGetAppTool,
  portalListStreamsTool,
  portalGetUserProfileTool,
  abstractRpcCallTool,
];

export const publicTools = tools;

const toolMap = new Map(tools.map(tool => [tool.name, tool]));

export function getTool(name: string): ToolHandler | undefined {
  return toolMap.get(name);
}
