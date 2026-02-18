import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import open from "open";
import type { Logger } from "../utils/logger.js";
import type { AgwSessionData } from "../session/types.js";

export interface BootstrapOptions {
  bootstrapUrl?: string;
  chainId: number;
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
    const accountAddress = (await rl.question("AGW account address: ")).trim();
    const signerRef = (await rl.question("Session signer ref (keyfile path or encrypted blob id): ")).trim();
    const expiresAtRaw = (await rl.question("Session expiry unix seconds: ")).trim();

    const expiresAt = Number.parseInt(expiresAtRaw, 10);
    if (!accountAddress || !signerRef || !Number.isFinite(expiresAt) || expiresAt <= 0) {
      throw new Error("Invalid bootstrap input.");
    }

    const now = Math.floor(Date.now() / 1000);
    return {
      accountAddress,
      chainId: options.chainId,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      status: "active",
      sessionConfig: {
        source: "manual-bootstrap",
        notes: "Replace with AGW web bootstrap exchange payload in production.",
      },
      sessionSignerRef: {
        kind: signerRef.startsWith("/") ? "keyfile" : "raw",
        value: signerRef,
      },
    };
  } finally {
    rl.close();
  }
}
