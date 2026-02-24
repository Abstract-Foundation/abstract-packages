import os from "node:os";
import path from "node:path";
import type { AgwSessionData } from "../session/types.js";
import type { SessionBundlePayload } from "./callback.js";

export interface MaterializeSessionFromBundleOptions {
  chainId: number;
  storageDir?: string;
  nowUnixSeconds?: number;
}

export function resolveStorageDir(storageDir?: string): string {
  return storageDir ?? path.join(os.homedir(), ".agw-mcp");
}

export function materializeSessionFromBundle(
  bundle: SessionBundlePayload,
  options: MaterializeSessionFromBundleOptions,
): AgwSessionData {
  if (bundle.chainId !== options.chainId) {
    throw new Error(`Session bundle chain id (${bundle.chainId}) does not match requested chain id (${options.chainId}).`);
  }

  const now = options.nowUnixSeconds ?? Math.floor(Date.now() / 1000);

  return {
    accountAddress: bundle.accountAddress,
    chainId: bundle.chainId,
    createdAt: now,
    updatedAt: now,
    status: "active",
  };
}
