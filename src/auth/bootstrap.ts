import open from "open";
import type { Logger } from "../utils/logger.js";
import type { AgwSessionData } from "../session/types.js";
import { parseSessionBundleInput } from "./callback.js";
import { createCompanionHandoffSecret, startCompanionHandoffServer } from "./handoff.js";
import { materializeSessionFromBundle } from "./provision.js";

export interface BootstrapOptions {
  companionUrl?: string;
  chainId: number;
  storageDir?: string;
}

export async function runBootstrapFlow(logger: Logger, options: BootstrapOptions): Promise<AgwSessionData> {
  const companionUrl = options.companionUrl ?? "http://127.0.0.1:4173";
  const handoffSecret = createCompanionHandoffSecret();
  const handoffServer = await startCompanionHandoffServer({
    secret: handoffSecret,
  });

  const companionLaunchUrl = new URL(companionUrl);
  companionLaunchUrl.searchParams.set("callbackUrl", handoffServer.callbackUrl);
  companionLaunchUrl.searchParams.set("chainId", String(options.chainId));

  logger.info(`Opening companion: ${companionLaunchUrl.toString()}`);
  try {
    await open(companionLaunchUrl.toString());
  } catch (error) {
    logger.warn(`Could not auto-open browser: ${error instanceof Error ? error.message : String(error)}`);
  }

  logger.info("Waiting for session approval in the browser...");

  try {
    const sessionPayload = await handoffServer.waitForPayload();
    const bundle = parseSessionBundleInput(sessionPayload);
    return materializeSessionFromBundle(bundle, {
      chainId: options.chainId,
      storageDir: options.storageDir,
    });
  } finally {
    await handoffServer.close().catch(() => undefined);
  }
}
