import open from "open";
import { randomBytes } from "node:crypto";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Logger } from "../utils/logger.js";
import { SessionStorage } from "../session/storage.js";
import { revokeSessionOnchain } from "../session/revoke.js";
import type { AgwSessionData } from "../session/types.js";
import { parseSessionBundleInput } from "./callback.js";
import {
  acquireBootstrapLock,
  assertBundleMatchesBootstrapRequest,
  buildLaunchUrl,
  captureStorageSnapshot,
  resolveAppUrl,
  resolvePreviousSignerMaterial,
  restoreStorageSnapshot,
  shouldAttemptOldSessionRevoke,
  validateAppUrl,
} from "./bootstrap-internals.js";
import { startCallbackServer } from "./handoff.js";
import { materializeSessionFromBundle, resolveStorageDir, writeSignerKeyfile } from "./provision.js";

export interface BootstrapOptions {
  appUrl?: string;
  chainId: number;
  rpcUrl?: string;
  storageDir?: string;
}

async function revokePreviousSessionIfNeeded(input: {
  logger: Logger;
  previousSession: AgwSessionData | null;
  previousSignerMaterial: `0x${string}` | null;
  rpcUrl?: string;
}): Promise<void> {
  const { logger, previousSession, previousSignerMaterial, rpcUrl } = input;
  const shouldRevokePrevious = shouldAttemptOldSessionRevoke(previousSession);
  if (!shouldRevokePrevious) {
    return;
  }
  if (!previousSignerMaterial) {
    logger.warn("New session created, but previous session signer material is unavailable for revoke.");
    return;
  }

  try {
    const { transactionHash } = await revokeSessionOnchain(
      {
        ...previousSession,
        sessionSignerRef: {
          kind: "raw",
          value: previousSignerMaterial,
        },
      },
      { rpcUrl },
    );
    logger.info(
      `Revoked previous session for ${previousSession.accountAddress} on chain ${previousSession.chainId} (${transactionHash}).`,
    );
  } catch (error) {
    logger.warn(`New session created, but previous session revoke failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function runBootstrapFlow(logger: Logger, options: BootstrapOptions): Promise<AgwSessionData> {
  const appUrl = resolveAppUrl(options);
  validateAppUrl(appUrl);

  const storageDir = resolveStorageDir(options.storageDir);
  const lock = acquireBootstrapLock(storageDir);

  const storage = new SessionStorage(storageDir);
  const previousSession = storage.load();
  const previousSignerMaterial = resolvePreviousSignerMaterial(previousSession);
  const snapshot = captureStorageSnapshot(storageDir);

  const sessionSignerKey = generatePrivateKey();
  const sessionSigner = privateKeyToAccount(sessionSignerKey);
  const callbackState = randomBytes(16).toString("hex");
  let callbackServer: Awaited<ReturnType<typeof startCallbackServer>> | null = null;

  try {
    writeSignerKeyfile(sessionSignerKey, storageDir);

    callbackServer = await startCallbackServer({
      expectedState: callbackState,
    });

    const launchUrl = buildLaunchUrl({
      appUrl,
      chainId: options.chainId,
      signerAddress: sessionSigner.address,
      callbackUrl: callbackServer.callbackUrl,
      callbackState,
    });

    logger.info(`Opening hosted onboarding app: ${launchUrl.toString()}`);
    try {
      await open(launchUrl.toString());
    } catch (error) {
      logger.warn(`Could not auto-open browser: ${error instanceof Error ? error.message : String(error)}`);
    }

    logger.info("Waiting for hosted session approval in the browser...");

    const sessionPayload = await callbackServer.waitForPayload();
    const bundle = parseSessionBundleInput(sessionPayload);
    assertBundleMatchesBootstrapRequest({
      bundle,
      requestedChainId: options.chainId,
      localSignerAddress: sessionSigner.address,
    });

    const materialized = materializeSessionFromBundle(bundle, {
      chainId: options.chainId,
      storageDir,
    });

    await revokePreviousSessionIfNeeded({
      logger,
      previousSession,
      previousSignerMaterial,
      rpcUrl: options.rpcUrl,
    });

    return materialized;
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
