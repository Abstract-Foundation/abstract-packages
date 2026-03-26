import type { CommandHandler } from "../types.js";
import { authSessionHandlers } from "./auth-session.js";
import { contractHandlers } from "./contract.js";
import { portalAppHandlers } from "./portal-app.js";
import { schemaHandlers } from "./schema.js";
import { txHandlers } from "./tx.js";
import { walletHandlers } from "./wallet.js";

export const commandHandlers: Record<string, CommandHandler> = {
  ...schemaHandlers,
  ...authSessionHandlers,
  ...walletHandlers,
  ...txHandlers,
  ...contractHandlers,
  ...portalAppHandlers,
};
