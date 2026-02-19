import { deployContractTool } from "./deploy-contract.js";
import { getBalancesTool } from "./get-balances.js";
import { getSessionStatusTool } from "./get-session-status.js";
import { getTokenListTool } from "./get-token-list.js";
import { getWalletAddressTool } from "./get-wallet-address.js";
import { previewTransactionTool } from "./preview-transaction.js";
import { revokeSessionTool } from "./revoke-session.js";
import { sendCallsTool } from "./send-calls.js";
import { sendTransactionTool } from "./send-transaction.js";
import { signMessageTool } from "./sign-message.js";
import { signTransactionTool } from "./sign-transaction.js";
import { swapTokensTool } from "./swap-tokens.js";
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
  transferTokenTool,
  swapTokensTool,
  previewTransactionTool,
  revokeSessionTool,
  sendTransactionTool,
  sendCallsTool,
  writeContractTool,
  deployContractTool,
];

export function getTool(name: string): ToolHandler | undefined {
  return tools.find(tool => tool.name === name);
}
