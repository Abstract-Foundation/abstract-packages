import { getSessionStatusTool } from "./get-session-status.js";
import { getWalletAddressTool } from "./get-wallet-address.js";
import { sendTransactionTool } from "./send-transaction.js";
import { signMessageTool } from "./sign-message.js";
import type { ToolHandler } from "./types.js";
import { writeContractTool } from "./write-contract.js";

export const tools: ToolHandler[] = [
  getWalletAddressTool,
  getSessionStatusTool,
  signMessageTool,
  sendTransactionTool,
  writeContractTool,
];

export function getTool(name: string): ToolHandler | undefined {
  return tools.find(tool => tool.name === name);
}
