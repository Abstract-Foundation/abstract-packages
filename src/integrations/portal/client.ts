import type {
  PortalAppDetail,
  PortalAppListResponse,
  PortalStreamsResponse,
  PortalUserProfile,
} from "./types.js";

const PORTAL_API_BASE_URL = "https://api.portal.abs.xyz";
const DEFAULT_TIMEOUT_MS = 10_000;

function normalizePositiveInteger(value: unknown, fieldName: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return value;
}

function normalizeLimit(limit: number | undefined): number | undefined {
  if (limit === undefined) {
    return undefined;
  }
  if (limit > 100) {
    throw new Error("limit must be less than or equal to 100.");
  }
  return limit;
}

async function fetchJson<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(path, PORTAL_API_BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new Error(`Portal API request failed (${response.status}) for ${url.pathname}: ${text.slice(0, 200)}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Portal API request timed out after ${DEFAULT_TIMEOUT_MS}ms for ${url.pathname}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function listPortalApps(input: { page?: number; limit?: number }): Promise<PortalAppListResponse> {
  const page = normalizePositiveInteger(input.page, "page");
  const limit = normalizeLimit(normalizePositiveInteger(input.limit, "limit"));
  return fetchJson<PortalAppListResponse>("/api/v1/app/", { page, limit });
}

export async function getPortalApp(input: { id: number; includeContracts?: boolean }): Promise<PortalAppDetail> {
  if (!Number.isInteger(input.id) || input.id <= 0) {
    throw new Error("id must be a positive integer.");
  }
  return fetchJson<PortalAppDetail>(`/api/v1/app/${input.id}/`, {
    include: input.includeContracts ? "contracts" : undefined,
  });
}

const VALID_STREAM_SORT = new Set(["latest", "recommended"] as const);
const VALID_STREAM_LANGUAGES = new Set([
  "english",
  "spanish",
  "portuguese",
  "chinese",
  "russian",
  "ukrainian",
  "turkish",
  "hungarian",
  "vietnamese",
  "filipino",
  "korean",
  "french",
  "japanese",
] as const);

export async function listPortalStreams(input: {
  app: number;
  page?: number;
  limit?: number;
  sortBy?: "latest" | "recommended";
  language?: string;
}): Promise<PortalStreamsResponse> {
  if (!Number.isInteger(input.app) || input.app <= 0) {
    throw new Error("app must be a positive integer.");
  }

  const page = normalizePositiveInteger(input.page, "page");
  const limit = normalizeLimit(normalizePositiveInteger(input.limit, "limit"));

  if (input.sortBy !== undefined && !VALID_STREAM_SORT.has(input.sortBy)) {
    throw new Error("sortBy must be either \"latest\" or \"recommended\".");
  }

  if (input.language !== undefined && !VALID_STREAM_LANGUAGES.has(input.language as (typeof VALID_STREAM_LANGUAGES extends Set<infer T> ? T : never))) {
    throw new Error("language is not supported by Portal API.");
  }

  return fetchJson<PortalStreamsResponse>(`/api/v1/streams/${input.app}/`, {
    page,
    limit,
    sortBy: input.sortBy,
    language: input.language,
  });
}

export async function getPortalUserProfile(address: string): Promise<PortalUserProfile> {
  const normalized = address.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(normalized)) {
    throw new Error("address must be a 20-byte 0x-prefixed EVM address.");
  }

  return fetchJson<PortalUserProfile>(`/api/v1/user/profile/${normalized}/`);
}
