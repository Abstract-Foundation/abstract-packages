import { resolveZeroExConfig } from "../../config/zeroex.js";

const DEFAULT_ZEROEX_API_BASE_URL = "https://api.0x.org";
const DEFAULT_ZEROEX_TIMEOUT_MS = 15_000;
const INTEGER_AMOUNT_PATTERN = /^[1-9]\d*$/;

export type ZeroExQuoteErrorCode =
  | "ZEROEX_REQUEST_INVALID"
  | "ZEROEX_HTTP_ERROR"
  | "ZEROEX_RESPONSE_INVALID"
  | "ZEROEX_NETWORK_ERROR"
  | "ZEROEX_TIMEOUT";

export class ZeroExQuoteError extends Error {
  readonly code: ZeroExQuoteErrorCode;
  readonly status?: number;
  readonly details?: Record<string, unknown>;

  constructor(input: { code: ZeroExQuoteErrorCode; message: string; status?: number; details?: Record<string, unknown> }) {
    super(input.message);
    this.name = "ZeroExQuoteError";
    this.code = input.code;
    this.status = input.status;
    this.details = input.details;
  }
}

export interface ZeroExQuoteRequest {
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount?: string;
  buyAmount?: string;
  taker?: string;
  slippageBps?: number;
}

export interface ZeroExFee {
  amount: string;
  token: string;
  type: string;
}

export interface ZeroExRouteFill {
  source: string;
  fromToken: string;
  toToken: string;
  proportionBps: string;
}

export interface ZeroExQuote {
  quoteId: string | null;
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  minBuyAmount: string | null;
  price: string | null;
  grossPrice: string | null;
  estimatedPriceImpact: string | null;
  allowanceTarget: string | null;
  gas: {
    limit: string | null;
    price: string | null;
    estimatedFee: string | null;
  };
  transaction: {
    to: string;
    data: string;
    value: string;
  };
  fees: {
    integratorFee: ZeroExFee | null;
    zeroExFee: ZeroExFee | null;
    gasFee: ZeroExFee | null;
  };
  issues: {
    allowance: {
      actual: string | null;
      spender: string | null;
    } | null;
    balance: {
      token: string | null;
      actual: string | null;
      expected: string | null;
    } | null;
    simulationIncomplete: boolean;
    invalidSourcesPassed: string[];
  };
  route: {
    fills: ZeroExRouteFill[];
  };
}

export interface ZeroExQuoteAdapter {
  getQuote: (request: ZeroExQuoteRequest) => Promise<ZeroExQuote>;
}

export interface ZeroExQuoteAdapterConfig {
  apiBaseUrl?: string;
  apiKey?: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

interface NormalizedQuoteRequest {
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount?: string;
  buyAmount?: string;
  taker?: string;
  slippageBps?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  return null;
}

function requireString(value: unknown, field: string): string {
  const normalized = asString(value);
  if (normalized === null) {
    throw new Error(`missing required field: ${field}`);
  }
  return normalized;
}

function normalizePositiveInteger(value: unknown, field: string): number {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} must be a positive integer`);
    }
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value, 10);
    if (parsed <= 0) {
      throw new Error(`${field} must be a positive integer`);
    }
    return parsed;
  }

  throw new Error(`${field} must be a positive integer`);
}

function normalizeAmount(value: unknown, field: string): string {
  const normalized = asString(value);
  if (normalized === null || !INTEGER_AMOUNT_PATTERN.test(normalized)) {
    throw new Error(`${field} must be a non-zero integer string`);
  }
  return normalized;
}

function normalizeRequest(request: ZeroExQuoteRequest): NormalizedQuoteRequest {
  const chainId = normalizePositiveInteger(request.chainId, "chainId");
  const sellToken = requireString(request.sellToken, "sellToken");
  const buyToken = requireString(request.buyToken, "buyToken");

  const sellAmountProvided = request.sellAmount !== undefined;
  const buyAmountProvided = request.buyAmount !== undefined;

  if (sellAmountProvided === buyAmountProvided) {
    throw new Error("exactly one of sellAmount or buyAmount must be provided");
  }

  let sellAmount: string | undefined;
  let buyAmount: string | undefined;
  if (sellAmountProvided) {
    sellAmount = normalizeAmount(request.sellAmount, "sellAmount");
  }
  if (buyAmountProvided) {
    buyAmount = normalizeAmount(request.buyAmount, "buyAmount");
  }

  let slippageBps: number | undefined;
  if (request.slippageBps !== undefined) {
    if (!Number.isInteger(request.slippageBps) || request.slippageBps < 0 || request.slippageBps > 10_000) {
      throw new Error("slippageBps must be an integer between 0 and 10000");
    }
    slippageBps = request.slippageBps;
  }

  const taker = request.taker === undefined ? undefined : requireString(request.taker, "taker");

  return {
    chainId,
    sellToken,
    buyToken,
    sellAmount,
    buyAmount,
    taker,
    slippageBps,
  };
}

function normalizeFee(value: unknown): ZeroExFee | null {
  if (!isRecord(value)) {
    return null;
  }

  const amount = asString(value.amount);
  const token = asString(value.token);
  const type = asString(value.type);
  if (amount === null || token === null || type === null) {
    return null;
  }

  return { amount, token, type };
}

function normalizeAllowanceIssue(value: unknown): { actual: string | null; spender: string | null } | null {
  if (!isRecord(value)) {
    return null;
  }

  const actual = asString(value.actual);
  const spender = asString(value.spender);
  if (actual === null && spender === null) {
    return null;
  }

  return { actual, spender };
}

function normalizeBalanceIssue(
  value: unknown,
): {
  token: string | null;
  actual: string | null;
  expected: string | null;
} | null {
  if (!isRecord(value)) {
    return null;
  }

  const token = asString(value.token);
  const actual = asString(value.actual);
  const expected = asString(value.expected);
  if (token === null && actual === null && expected === null) {
    return null;
  }

  return { token, actual, expected };
}

function normalizeInvalidSources(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: string[] = [];
  for (const source of value) {
    const parsed = asString(source);
    if (parsed) {
      normalized.push(parsed);
    }
  }
  return normalized;
}

function normalizeRouteFills(value: unknown): ZeroExRouteFill[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const fills: ZeroExRouteFill[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }

    const source = asString(entry.source);
    const fromToken = asString(entry.fromToken ?? entry.from);
    const toToken = asString(entry.toToken ?? entry.to);
    const proportionBps = asString(entry.proportionBps);
    if (source === null || fromToken === null || toToken === null || proportionBps === null) {
      continue;
    }

    fills.push({
      source,
      fromToken,
      toToken,
      proportionBps,
    });
  }

  return fills;
}

function normalizeQuotePayload(payload: unknown, request: NormalizedQuoteRequest): ZeroExQuote {
  if (!isRecord(payload)) {
    throw new Error("response payload must be an object");
  }

  const issues = isRecord(payload.issues) ? payload.issues : {};
  const route = isRecord(payload.route) ? payload.route : {};
  const fees = isRecord(payload.fees) ? payload.fees : {};

  return {
    quoteId: asString(payload.zid),
    chainId: normalizePositiveInteger(payload.chainId ?? request.chainId, "chainId"),
    sellToken: requireString(payload.sellToken, "sellToken"),
    buyToken: requireString(payload.buyToken, "buyToken"),
    sellAmount: requireString(payload.sellAmount, "sellAmount"),
    buyAmount: requireString(payload.buyAmount, "buyAmount"),
    minBuyAmount: asString(payload.minBuyAmount),
    price: asString(payload.price),
    grossPrice: asString(payload.grossPrice),
    estimatedPriceImpact: asString(payload.estimatedPriceImpact),
    allowanceTarget: asString(payload.allowanceTarget),
    gas: {
      limit: asString(payload.gas),
      price: asString(payload.gasPrice),
      estimatedFee: asString(payload.totalNetworkFee),
    },
    transaction: {
      to: requireString(payload.to, "to"),
      data: requireString(payload.data, "data"),
      value: asString(payload.value) ?? "0",
    },
    fees: {
      integratorFee: normalizeFee(fees.integratorFee),
      zeroExFee: normalizeFee(fees.zeroExFee),
      gasFee: normalizeFee(fees.gasFee),
    },
    issues: {
      allowance: normalizeAllowanceIssue(issues.allowance),
      balance: normalizeBalanceIssue(issues.balance),
      simulationIncomplete: issues.simulationIncomplete === true,
      invalidSourcesPassed: normalizeInvalidSources(issues.invalidSourcesPassed),
    },
    route: {
      fills: normalizeRouteFills(route.fills),
    },
  };
}

function truncateForError(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function summarizeHttpErrorBody(bodyText: string): string | null {
  const normalizedBody = bodyText.trim();
  if (!normalizedBody) {
    return null;
  }

  try {
    const parsed = JSON.parse(normalizedBody) as unknown;
    if (isRecord(parsed)) {
      const message = asString(parsed.message);
      if (message) {
        return message;
      }

      if (Array.isArray(parsed.validationErrors) && parsed.validationErrors.length > 0) {
        const firstValidationError = parsed.validationErrors[0];
        if (isRecord(firstValidationError)) {
          const reason = asString(firstValidationError.reason);
          if (reason) {
            return reason;
          }
        }
      }
    }
  } catch {
    return truncateForError(normalizedBody, 180);
  }

  return truncateForError(normalizedBody, 180);
}

function buildQuoteUrl(apiBaseUrl: string, request: NormalizedQuoteRequest): string {
  const url = new URL("/swap/allowance-holder/quote", apiBaseUrl);
  url.searchParams.set("chainId", String(request.chainId));
  url.searchParams.set("sellToken", request.sellToken);
  url.searchParams.set("buyToken", request.buyToken);

  if (request.sellAmount !== undefined) {
    url.searchParams.set("sellAmount", request.sellAmount);
  }
  if (request.buyAmount !== undefined) {
    url.searchParams.set("buyAmount", request.buyAmount);
  }
  if (request.taker !== undefined) {
    url.searchParams.set("taker", request.taker);
  }
  if (request.slippageBps !== undefined) {
    url.searchParams.set("slippageBps", String(request.slippageBps));
  }

  return url.toString();
}

function normalizeTimeoutMs(timeoutMs: number | undefined): number {
  if (timeoutMs === undefined) {
    return DEFAULT_ZEROEX_TIMEOUT_MS;
  }

  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error("timeoutMs must be a positive integer");
  }

  return timeoutMs;
}

function normalizeApiBaseUrl(apiBaseUrl: string | undefined): string {
  const normalized = asString(apiBaseUrl) ?? DEFAULT_ZEROEX_API_BASE_URL;
  try {
    return new URL(normalized).toString();
  } catch {
    throw new Error("apiBaseUrl must be a valid absolute URL");
  }
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === "AbortError";
}

export function createZeroExQuoteAdapter(config: ZeroExQuoteAdapterConfig = {}): ZeroExQuoteAdapter {
  const fetchFn = config.fetchFn ?? fetch;
  const timeoutMs = normalizeTimeoutMs(config.timeoutMs);
  const apiBaseUrl = normalizeApiBaseUrl(config.apiBaseUrl);
  const apiKey = asString(config.apiKey);

  return {
    async getQuote(request: ZeroExQuoteRequest): Promise<ZeroExQuote> {
      let normalizedRequest: NormalizedQuoteRequest;
      try {
        normalizedRequest = normalizeRequest(request);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new ZeroExQuoteError({
          code: "ZEROEX_REQUEST_INVALID",
          message: `invalid 0x quote request: ${message}`,
        });
      }

      const url = buildQuoteUrl(apiBaseUrl, normalizedRequest);
      const headers: Record<string, string> = {
        accept: "application/json",
        "0x-version": "v2",
      };
      if (apiKey) {
        headers["0x-api-key"] = apiKey;
      }

      const abortController = new AbortController();
      const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers,
          signal: abortController.signal,
        });
      } catch (error) {
        if (isAbortError(error)) {
          throw new ZeroExQuoteError({
            code: "ZEROEX_TIMEOUT",
            message: `0x quote request timed out after ${timeoutMs}ms`,
          });
        }

        const message = error instanceof Error ? error.message : String(error);
        throw new ZeroExQuoteError({
          code: "ZEROEX_NETWORK_ERROR",
          message: `0x quote request failed: ${message}`,
          details: {
            cause: message,
          },
        });
      } finally {
        clearTimeout(timeoutHandle);
      }

      if (!response.ok) {
        const bodyText = await response.text();
        const reason = summarizeHttpErrorBody(bodyText);
        const reasonSuffix = reason ? `: ${reason}` : "";
        throw new ZeroExQuoteError({
          code: "ZEROEX_HTTP_ERROR",
          status: response.status,
          message: `0x quote request failed with status ${response.status}${reasonSuffix}`,
          details: {
            statusText: response.statusText,
            body: truncateForError(bodyText, 512),
          },
        });
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new ZeroExQuoteError({
          code: "ZEROEX_RESPONSE_INVALID",
          status: response.status,
          message: `0x quote response is not valid JSON: ${message}`,
        });
      }

      try {
        return normalizeQuotePayload(payload, normalizedRequest);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new ZeroExQuoteError({
          code: "ZEROEX_RESPONSE_INVALID",
          status: response.status,
          message: `0x quote response validation failed: ${message}`,
        });
      }
    },
  };
}

const defaultZeroExConfig = resolveZeroExConfig();
export const zeroExQuoteAdapter = createZeroExQuoteAdapter({ apiKey: defaultZeroExConfig.apiKey });
