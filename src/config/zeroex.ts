const ZEROEX_API_KEY_ENV_KEYS = ["AGW_MCP_ZEROEX_API_KEY", "ZEROEX_API_KEY"] as const;

export interface ResolveZeroExConfigInput {
  apiKey?: string;
  env?: NodeJS.ProcessEnv;
}

export interface ResolvedZeroExConfig {
  apiKey?: string;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function resolveEnvValue(env: NodeJS.ProcessEnv, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = normalizeOptionalString(env[key]);
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function resolveZeroExConfig(input: ResolveZeroExConfigInput = {}): ResolvedZeroExConfig {
  const env = input.env ?? process.env;
  const apiKey = normalizeOptionalString(input.apiKey) ?? resolveEnvValue(env, ZEROEX_API_KEY_ENV_KEYS);

  return {
    apiKey,
  };
}
