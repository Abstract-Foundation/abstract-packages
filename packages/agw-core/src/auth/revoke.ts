import { randomBytes } from "node:crypto";
import type { AgwSessionData } from "../session/types.js";
import type { Logger } from "../utils/logger.js";
import {
  assertRevokeBundleMatchesRequest,
  buildRevokeLaunchUrl,
  resolveAppUrl,
  validateAppUrl,
} from "./bootstrap-internals.js";
import { parseRevokeSignerBundlePayload } from "./callback.js";
import { resolveCallbackVerificationConfig, verifySignedCallbackToken } from "./attestation.js";
import { startCallbackServer } from "./handoff.js";

export interface RemoteRevokeOptions {
  appUrl?: string;
}

export async function runRemoteRevokeFlow(
  logger: Logger,
  session: AgwSessionData,
  options: RemoteRevokeOptions = {},
): Promise<void> {
  if (!session.privyWalletId || !session.privySignerBinding) {
    throw new Error("session is missing remote signer metadata");
  }

  const appUrl = resolveAppUrl(options);
  validateAppUrl(appUrl);

  const callbackState = randomBytes(16).toString("hex");
  const callbackVerificationConfig = await resolveCallbackVerificationConfig(appUrl);
  const callbackServer = await startCallbackServer({
    expectedState: callbackState,
  });

  try {
    const launchUrl = buildRevokeLaunchUrl({
      appUrl,
      chainId: session.chainId,
      callbackUrl: callbackServer.callbackUrl,
      callbackState,
      accountAddress: session.accountAddress,
      walletId: session.privyWalletId,
      signerId: session.privySignerBinding.id,
      signerLabel: session.privySignerBinding.label,
      signerFingerprint: session.privySignerBinding.fingerprint,
    });

    logger.info(`Opening hosted revoke flow: ${launchUrl.toString()}`);
    try {
      const { default: open } = await import("open");
      await open(launchUrl.toString());
    } catch (error) {
      logger.warn(`Could not auto-open browser: ${error instanceof Error ? error.message : String(error)}`);
    }

    logger.info("Waiting for hosted signer revocation approval in the browser (callback window: 15 minutes)...");
    const payload = await callbackServer.waitForPayload();
    const envelope = verifySignedCallbackToken<Record<string, unknown>>(payload, callbackVerificationConfig);
    const bundle = parseRevokeSignerBundlePayload(envelope.payload);
    if (bundle.state !== callbackState) {
      throw new Error("Revoke bundle state does not match the revoke request.");
    }
    assertRevokeBundleMatchesRequest({
      bundle,
      requestedChainId: session.chainId,
      walletId: session.privyWalletId,
      signerId: session.privySignerBinding.id,
    });

    if (bundle.accountAddress.toLowerCase() !== session.accountAddress.toLowerCase()) {
      throw new Error(`Revoke bundle account address (${bundle.accountAddress}) does not match the active session.`);
    }
    if (
      session.underlyingSignerAddress &&
      bundle.underlyingSignerAddress.toLowerCase() !== session.underlyingSignerAddress.toLowerCase()
    ) {
      throw new Error(
        `Revoke bundle underlying signer address (${bundle.underlyingSignerAddress}) does not match the active session.`,
      );
    }
  } finally {
    await callbackServer.close().catch(() => undefined);
  }
}
