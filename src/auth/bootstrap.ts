import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import open from "open";
import type { Logger } from "../utils/logger.js";
import type { AgwSessionData } from "../session/types.js";
import { parseSessionBundleInput } from "./callback.js";
import { createCompanionHandoffSecret, startCompanionHandoffServer } from "./handoff.js";
import { materializeSessionFromBundle } from "./provision.js";

export interface BootstrapOptions {
  bootstrapUrl?: string;
  companionUrl?: string;
  chainId: number;
  storageDir?: string;
}

async function registerCompanionHandoffSession(
  companionBaseUrl: string,
  handoffUrl: string,
  handoffSecret: string,
): Promise<string> {
  const response = await fetch(new URL("/handoff/session", companionBaseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      handoffUrl,
      handoffSecret,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Companion handoff registration failed (${response.status}): ${details || "unknown error"}`);
  }

  const payload = (await response.json()) as { handoffSessionId?: unknown };
  if (typeof payload.handoffSessionId !== "string" || !payload.handoffSessionId.trim()) {
    throw new Error("Companion handoff registration returned an invalid handoffSessionId.");
  }

  return payload.handoffSessionId;
}

export async function runBootstrapFlow(logger: Logger, options: BootstrapOptions): Promise<AgwSessionData> {
  const bootstrapUrl = options.bootstrapUrl ?? "https://docs.abs.xyz/abstract-global-wallet/overview";
  const companionUrl = options.companionUrl ?? "http://127.0.0.1:4173";
  const handoffSecret = createCompanionHandoffSecret();
  const handoffServer = await startCompanionHandoffServer({
    secret: handoffSecret,
  });
  let handoffSessionId: string | null = null;
  try {
    handoffSessionId = await registerCompanionHandoffSession(companionUrl, handoffServer.callbackUrl, handoffSecret);
  } catch (error) {
    logger.warn(
      `Secure companion handoff unavailable (${error instanceof Error ? error.message : String(error)}). Falling back to manual payload paste.`,
    );
  }
  const companionLaunchUrl = new URL(companionUrl);
  companionLaunchUrl.searchParams.set("callbackUrl", handoffServer.callbackUrl);
  companionLaunchUrl.searchParams.set("chainId", String(options.chainId));
  if (handoffSessionId) {
    companionLaunchUrl.searchParams.set("handoffSessionId", handoffSessionId);
  }

  logger.info(`Opening bootstrap instructions: ${bootstrapUrl}`);
  try {
    await open(bootstrapUrl);
  } catch (error) {
    logger.warn(`Could not auto-open browser: ${error instanceof Error ? error.message : String(error)}`);
  }
  logger.info(`Opening local companion flow: ${companionLaunchUrl.toString()}`);
  try {
    await open(companionLaunchUrl.toString());
  } catch (error) {
    logger.warn(`Could not auto-open companion app: ${error instanceof Error ? error.message : String(error)}`);
  }

  const rl = readline.createInterface({ input, output });

  try {
    logger.info("Complete AGW session approval in the browser.");
    if (handoffSessionId) {
      logger.info("Press Enter to wait for secure companion handoff, or paste callback/session payload manually.");
    } else {
      logger.info("Secure handoff is unavailable in this run. Paste callback/session payload manually.");
    }
    const callbackInput = await rl.question("Callback URL or session bundle payload (optional): ");
    const payloadInput = callbackInput.trim();
    const sessionPayload =
      payloadInput ||
      (handoffSessionId
        ? await handoffServer.waitForPayload()
        : (() => {
            throw new Error("Companion handoff is unavailable; provide callback/session payload manually.");
          })());
    const bundle = parseSessionBundleInput(sessionPayload);
    return materializeSessionFromBundle(bundle, {
      chainId: options.chainId,
      storageDir: options.storageDir,
    });
  } finally {
    await handoffServer.close().catch(() => undefined);
    rl.close();
  }
}
