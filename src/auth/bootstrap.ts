import open from "open";
import { randomBytes } from "node:crypto";
import type { Logger } from "../utils/logger.js";
import type { AgwSessionData } from "../session/types.js";
import { parseSessionBundleInput } from "./callback.js";
import {
  acquireBootstrapLock,
  assertBundleMatchesBootstrapRequest,
  buildLaunchUrl,
  captureStorageSnapshot,
  resolveAppUrl,
  restoreStorageSnapshot,
  validateAppUrl,
} from "./bootstrap-internals.js";
import { startCallbackServer } from "./handoff.js";
import { materializeSessionFromBundle, resolveStorageDir } from "./provision.js";

export interface BootstrapOptions {
  appUrl?: string;
  chainId: number;
  rpcUrl?: string;
  storageDir?: string;
}

export async function runBootstrapFlow(logger: Logger, options: BootstrapOptions): Promise<AgwSessionData> {
  const appUrl = resolveAppUrl(options);
  validateAppUrl(appUrl);

  const storageDir = resolveStorageDir(options.storageDir);
  const lock = acquireBootstrapLock(storageDir);

  const snapshot = captureStorageSnapshot(storageDir);

  const callbackState = randomBytes(16).toString("hex");
  let callbackServer: Awaited<ReturnType<typeof startCallbackServer>> | null = null;

  try {
    callbackServer = await startCallbackServer({
      expectedState: callbackState,
    });

    const launchUrl = buildLaunchUrl({
      appUrl,
      chainId: options.chainId,
      callbackUrl: callbackServer.callbackUrl,
      callbackState,
    });

    logger.info(`Opening hosted onboarding app: ${launchUrl.toString()}`);
    try {
      await open(launchUrl.toString());
    } catch (error) {
      logger.warn(`Could not auto-open browser: ${error instanceof Error ? error.message : String(error)}`);
    }

    logger.info("Waiting for hosted wallet-link approval in the browser (callback window: 15 minutes)...");

    const sessionPayload = await callbackServer.waitForPayload();
    const bundle = parseSessionBundleInput(sessionPayload);
    assertBundleMatchesBootstrapRequest({
      bundle,
      requestedChainId: options.chainId,
    });

    return materializeSessionFromBundle(bundle, {
      chainId: options.chainId,
      storageDir,
    });
  } catch (error) {
    restoreStorageSnapshot(snapshot);
    throw error;
  } finally {
    if (callbackServer) {
      await callbackServer.close().catch(() => undefined);
    }
    lock.release();
  }
}
