import {
  ZeroExQuoteError,
  createZeroExQuoteAdapter,
  type ZeroExQuote,
} from "../src/integrations/zeroex/quote-adapter.js";

interface MockResponseInput {
  ok: boolean;
  status: number;
  statusText?: string;
  jsonData?: unknown;
  textData?: string;
}

function createMockResponse(input: MockResponseInput): Response {
  return {
    ok: input.ok,
    status: input.status,
    statusText: input.statusText ?? "",
    json: async () => input.jsonData,
    text: async () => input.textData ?? JSON.stringify(input.jsonData ?? {}),
  } as Response;
}

function getHeaderValue(headers: HeadersInit | undefined, key: string): string | null {
  if (!headers) {
    return null;
  }

  if (headers instanceof Headers) {
    return headers.get(key);
  }

  if (Array.isArray(headers)) {
    const entry = headers.find(([headerName]) => headerName.toLowerCase() === key.toLowerCase());
    return entry?.[1] ?? null;
  }

  for (const [headerName, headerValue] of Object.entries(headers)) {
    if (headerName.toLowerCase() === key.toLowerCase()) {
      return headerValue;
    }
  }

  return null;
}

function expectQuoteError(error: unknown, code: string): asserts error is ZeroExQuoteError {
  expect(error).toBeInstanceOf(ZeroExQuoteError);
  expect((error as ZeroExQuoteError).code).toBe(code);
}

describe("0x quote adapter", () => {
  it("retrieves and normalizes quote payload to a stable schema", async () => {
    const responsePayload = {
      chainId: 11124,
      zid: "0x-quote-id",
      sellToken: "0xaaaa000000000000000000000000000000000001",
      buyToken: "0xbbbb000000000000000000000000000000000002",
      sellAmount: "1000000",
      buyAmount: "2000000",
      minBuyAmount: "1980000",
      price: "2",
      grossPrice: "2.01",
      estimatedPriceImpact: "0.0123",
      gas: "210000",
      gasPrice: "1000000000",
      totalNetworkFee: "210000000000000",
      allowanceTarget: "0xcccc000000000000000000000000000000000003",
      to: "0xdddd000000000000000000000000000000000004",
      data: "0xabcdef",
      value: "0",
      fees: {
        integratorFee: {
          amount: "1000",
          token: "0xeeee000000000000000000000000000000000005",
          type: "volume",
        },
      },
      issues: {
        simulationIncomplete: false,
        invalidSourcesPassed: ["BrokenDex"],
      },
      route: {
        fills: [
          {
            source: "Uniswap_V3",
            from: "0xaaaa000000000000000000000000000000000001",
            to: "0xbbbb000000000000000000000000000000000002",
            proportionBps: "10000",
          },
        ],
      },
    };

    const fetchFn = jest.fn(async () => createMockResponse({ ok: true, status: 200, jsonData: responsePayload })) as unknown as typeof fetch;

    const adapter = createZeroExQuoteAdapter({
      fetchFn,
      apiBaseUrl: "https://api.0x.org",
      apiKey: "test-api-key",
    });

    const quote = (await adapter.getQuote({
      chainId: 11124,
      sellToken: "0xaaaa000000000000000000000000000000000001",
      buyToken: "0xbbbb000000000000000000000000000000000002",
      sellAmount: "1000000",
      slippageBps: 50,
      taker: "0xffff000000000000000000000000000000000006",
    })) as ZeroExQuote;

    expect(quote).toEqual({
      quoteId: "0x-quote-id",
      chainId: 11124,
      sellToken: "0xaaaa000000000000000000000000000000000001",
      buyToken: "0xbbbb000000000000000000000000000000000002",
      sellAmount: "1000000",
      buyAmount: "2000000",
      minBuyAmount: "1980000",
      price: "2",
      grossPrice: "2.01",
      estimatedPriceImpact: "0.0123",
      allowanceTarget: "0xcccc000000000000000000000000000000000003",
      gas: {
        limit: "210000",
        price: "1000000000",
        estimatedFee: "210000000000000",
      },
      transaction: {
        to: "0xdddd000000000000000000000000000000000004",
        data: "0xabcdef",
        value: "0",
      },
      fees: {
        integratorFee: {
          amount: "1000",
          token: "0xeeee000000000000000000000000000000000005",
          type: "volume",
        },
        zeroExFee: null,
        gasFee: null,
      },
      issues: {
        allowance: null,
        balance: null,
        simulationIncomplete: false,
        invalidSourcesPassed: ["BrokenDex"],
      },
      route: {
        fills: [
          {
            source: "Uniswap_V3",
            fromToken: "0xaaaa000000000000000000000000000000000001",
            toToken: "0xbbbb000000000000000000000000000000000002",
            proportionBps: "10000",
          },
        ],
      },
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, requestInit] = (fetchFn as jest.Mock).mock.calls[0] as [string, RequestInit | undefined];
    const parsedUrl = new URL(url);

    expect(parsedUrl.toString()).toContain("/swap/allowance-holder/quote?");
    expect(parsedUrl.searchParams.get("chainId")).toBe("11124");
    expect(parsedUrl.searchParams.get("sellToken")).toBe("0xaaaa000000000000000000000000000000000001");
    expect(parsedUrl.searchParams.get("buyToken")).toBe("0xbbbb000000000000000000000000000000000002");
    expect(parsedUrl.searchParams.get("sellAmount")).toBe("1000000");
    expect(parsedUrl.searchParams.get("slippageBps")).toBe("50");
    expect(parsedUrl.searchParams.get("taker")).toBe("0xffff000000000000000000000000000000000006");
    expect(getHeaderValue(requestInit?.headers, "0x-api-key")).toBe("test-api-key");
    expect(getHeaderValue(requestInit?.headers, "0x-version")).toBe("v2");
  });

  it("rejects invalid quote requests before calling 0x", async () => {
    const fetchFn = jest.fn(async () => createMockResponse({ ok: true, status: 200, jsonData: {} })) as unknown as typeof fetch;
    const adapter = createZeroExQuoteAdapter({ fetchFn });

    await expect(
      adapter.getQuote({
        chainId: 11124,
        sellToken: "0xaaaa000000000000000000000000000000000001",
        buyToken: "0xbbbb000000000000000000000000000000000002",
      }),
    ).rejects.toMatchObject({
      code: "ZEROEX_REQUEST_INVALID",
    });

    await expect(
      adapter.getQuote({
        chainId: 11124,
        sellToken: "0xaaaa000000000000000000000000000000000001",
        buyToken: "0xbbbb000000000000000000000000000000000002",
        sellAmount: "1",
        buyAmount: "1",
      }),
    ).rejects.toMatchObject({
      code: "ZEROEX_REQUEST_INVALID",
    });

    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("maps non-2xx responses into deterministic adapter errors", async () => {
    const fetchFn = jest.fn(async () =>
      createMockResponse({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        jsonData: {
          validationErrors: [{ reason: "SELL_AMOUNT_TOO_LOW" }],
        },
      }),
    ) as unknown as typeof fetch;

    const adapter = createZeroExQuoteAdapter({ fetchFn });

    await expect(
      adapter.getQuote({
        chainId: 11124,
        sellToken: "0xaaaa000000000000000000000000000000000001",
        buyToken: "0xbbbb000000000000000000000000000000000002",
        sellAmount: "1",
      }),
    ).rejects.toMatchObject({
      code: "ZEROEX_HTTP_ERROR",
      status: 400,
      message: expect.stringContaining("SELL_AMOUNT_TOO_LOW"),
    });
  });

  it("maps malformed 0x payloads into response validation errors", async () => {
    const fetchFn = jest.fn(async () =>
      createMockResponse({
        ok: true,
        status: 200,
        jsonData: {
          chainId: 11124,
          sellToken: "0xaaaa000000000000000000000000000000000001",
          buyToken: "0xbbbb000000000000000000000000000000000002",
          sellAmount: "1000",
          buyAmount: "2000",
          data: "0xdeadbeef",
        },
      }),
    ) as unknown as typeof fetch;

    const adapter = createZeroExQuoteAdapter({ fetchFn });

    await expect(
      adapter.getQuote({
        chainId: 11124,
        sellToken: "0xaaaa000000000000000000000000000000000001",
        buyToken: "0xbbbb000000000000000000000000000000000002",
        sellAmount: "1000",
      }),
    ).rejects.toMatchObject({
      code: "ZEROEX_RESPONSE_INVALID",
      message: expect.stringContaining("missing required field"),
    });
  });

  it("preserves exact network errors in adapter failures", async () => {
    const fetchFn = jest.fn(async () => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:443");
    }) as unknown as typeof fetch;

    const adapter = createZeroExQuoteAdapter({ fetchFn });

    try {
      await adapter.getQuote({
        chainId: 11124,
        sellToken: "0xaaaa000000000000000000000000000000000001",
        buyToken: "0xbbbb000000000000000000000000000000000002",
        sellAmount: "1000",
      });
      throw new Error("expected getQuote to fail");
    } catch (error) {
      expectQuoteError(error, "ZEROEX_NETWORK_ERROR");
      expect(error.message).toContain("connect ECONNREFUSED 127.0.0.1:443");
    }
  });
});
