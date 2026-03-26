import os from "node:os";
import path from "node:path";
import type { AgwOutputMode, AgwSanitizeProfile } from "../registry/types.js";

const DEFAULT_HOME_DIRNAME = ".agw";

export const AGW_HTTP_HEADERS: Record<string, string> = {
  "User-Agent": "AGW-CLI/1.0",
};
const OUTPUT_ENV_KEY = "AGW_OUTPUT";
const SANITIZE_ENV_KEY = "AGW_SANITIZE_PROFILE";
const HOME_ENV_KEY = "AGW_HOME";
const APP_URL_ENV_KEY = "AGW_APP_URL";

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === "" ? undefined : normalized;
}

export function resolveAgwHome(options: { homeDir?: string; env?: NodeJS.ProcessEnv } = {}): string {
  const env = options.env ?? process.env;
  return normalizeOptionalString(options.homeDir) ?? normalizeOptionalString(env[HOME_ENV_KEY]) ?? path.join(os.homedir(), DEFAULT_HOME_DIRNAME);
}

export function resolveAppUrlFromEnv(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return normalizeOptionalString(env[APP_URL_ENV_KEY]);
}

export function resolveOutputMode(input: {
  explicit?: AgwOutputMode;
  payload?: AgwOutputMode;
  defaultMode: AgwOutputMode;
  supportsPagination: boolean;
  stdoutIsTTY?: boolean;
  env?: NodeJS.ProcessEnv;
}): AgwOutputMode {
  const env = input.env ?? process.env;
  const envValue = normalizeOptionalString(env[OUTPUT_ENV_KEY]);

  if (input.explicit) {
    return input.explicit;
  }
  if (input.payload) {
    return input.payload;
  }
  if (envValue === "json" || envValue === "ndjson") {
    return envValue;
  }
  if (input.supportsPagination && input.stdoutIsTTY === false) {
    return "ndjson";
  }
  return input.defaultMode;
}

export function resolveSanitizeProfile(input: {
  explicit?: AgwSanitizeProfile;
  defaultProfile: AgwSanitizeProfile;
  env?: NodeJS.ProcessEnv;
}): AgwSanitizeProfile {
  const env = input.env ?? process.env;
  const envValue = normalizeOptionalString(env[SANITIZE_ENV_KEY]);

  if (input.explicit) {
    return input.explicit;
  }
  if (envValue === "off" || envValue === "strict") {
    return envValue;
  }
  return input.defaultProfile;
}
