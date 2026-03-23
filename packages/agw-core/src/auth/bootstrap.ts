import open from "open";
import { randomBytes } from "node:crypto";
import { computePublicKeyFingerprint, generateP256KeyPair, publicKeyToBase64 } from "../privy/auth.js";
import type { Logger } from "../utils/logger.js";
import { SessionStorage } from "../session/storage.js";
import type { AgwSessionData } from "../session/types.js";
import { parseInitSignerBundlePayload } from "./callback.js";
import {
  acquireBootstrapLock,
  assertBundleMatchesBootstrapRequest,
  buildLaunchUrl,
  captureStorageSnapshot,
  resolveAppUrl,
  restoreStorageSnapshot,
  validateAppUrl,
} from "./bootstrap-internals.js";
import { resolveCallbackVerificationConfig, verifySignedCallbackToken } from "./attestation.js";
import { startCallbackServer } from "./handoff.js";
import { materializeSessionFromBundle, resolveStorageDir } from "./provision.js";

export interface BootstrapOptions {
  appUrl?: string;
  chainId: number;
  homeDir?: string;
  rpcUrl?: string;
}

export async function runBootstrapFlow(logger: Logger, options: BootstrapOptions): Promise<AgwSessionData> {
  const appUrl = resolveAppUrl(options);
  validateAppUrl(appUrl);

  const storageDir = resolveStorageDir(options.homeDir);
  const lock = acquireBootstrapLock(storageDir);

  const storage = new SessionStorage(storageDir);
  const previousSession = storage.load();
  if (previousSession && previousSession.status === "active") {
    logger.warn("Replacing existing active session. The previous signer will remain registered until explicitly revoked.");
  }
  const snapshot = captureStorageSnapshot(storageDir);

  const keyPair = generateP256KeyPair();
  const publicKeyBase64 = publicKeyToBase64(keyPair.publicKeyDer);
  const expectedFingerprint = computePublicKeyFingerprint(keyPair.publicKeyDer);
  const callbackState = randomBytes(16).toString("hex");
  const callbackVerificationConfig = await resolveCallbackVerificationConfig(appUrl);
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
      authPublicKey: publicKeyBase64,
    });

    logger.info(`Opening hosted onboarding app: ${launchUrl.toString()}`);
    try {
      await open(launchUrl.toString());
    } catch (error) {
      logger.warn(`Could not auto-open browser: ${error instanceof Error ? error.message : String(error)}`);
    }

    logger.info("Waiting for hosted session approval in the browser (callback window: 15 minutes)...");

    const sessionPayload = await callbackServer.waitForPayload();
    const envelope = verifySignedCallbackToken<Record<string, unknown>>(sessionPayload, callbackVerificationConfig);
    const bundle = parseInitSignerBundlePayload(envelope.payload);
    if (bundle.state !== callbackState) {
      throw new Error("Signer bundle state does not match the bootstrap request.");
    }
    assertBundleMatchesBootstrapRequest({
      bundle,
      requestedChainId: options.chainId,
    });
    if (bundle.signerFingerprint !== expectedFingerprint) {
      throw new Error(`Signer fingerprint (${bundle.signerFingerprint}) does not match the local device key.`);
    }

    const authKeyfilePath = storage.path.replace(/session\.json$/, "privy-auth.key");
    const session = materializeSessionFromBundle(bundle, {
      chainId: options.chainId,
      authKeyfilePath,
    });
    storage.saveProvisionedSession(session, keyPair.privateKeyDer);

    return session;
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
