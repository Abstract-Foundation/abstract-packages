import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import open from "open";
import type { Logger } from "../utils/logger.js";
import type { AgwSessionData } from "../session/types.js";
import { parseSessionBundleInput } from "./callback.js";
import { materializeSessionFromBundle } from "./provision.js";

export interface BootstrapOptions {
  bootstrapUrl?: string;
  chainId: number;
  storageDir?: string;
}

export async function runBootstrapFlow(logger: Logger, options: BootstrapOptions): Promise<AgwSessionData> {
  const bootstrapUrl = options.bootstrapUrl ?? "https://docs.abs.xyz/abstract-global-wallet/overview";

  logger.info(`Opening bootstrap instructions: ${bootstrapUrl}`);
  try {
    await open(bootstrapUrl);
  } catch (error) {
    logger.warn(`Could not auto-open browser: ${error instanceof Error ? error.message : String(error)}`);
  }

  const rl = readline.createInterface({ input, output });

  try {
    logger.info("Complete AGW session approval in the browser, then copy the callback URL or session bundle payload.");
    const callbackInput = await rl.question("Callback URL or session bundle payload: ");
    const bundle = parseSessionBundleInput(callbackInput);
    return materializeSessionFromBundle(bundle, {
      chainId: options.chainId,
      storageDir: options.storageDir,
    });
  } finally {
    rl.close();
  }
}
