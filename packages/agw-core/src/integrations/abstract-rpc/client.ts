export interface AbstractRpcRequest {
  method: string;
  params?: unknown[];
}

export interface AbstractRpcSuccess {
  result: unknown;
}

const BLOCKED_METHODS = new Set([
  "eth_sendRawTransaction",
  "zks_sendRawTransactionWithDetailedOutput",
  "eth_subscribe",
  "eth_unsubscribe",
  "eth_newFilter",
  "eth_newBlockFilter",
  "eth_uninstallFilter",
  "eth_newPendingTransactionFilter",
  "eth_getFilterLogs",
  "eth_getFilterChanges",
]);

const ALLOWED_METHODS = new Set([
  "eth_chainId",
  "eth_call",
  "eth_estimateGas",
  "eth_gasPrice",
  "eth_getLogs",
  "eth_getBalance",
  "web3_clientVersion",
  "eth_getBlockByNumber",
  "eth_getBlockByHash",
  "eth_getBlockTransactionCountByNumber",
  "eth_getBlockReceipts",
  "eth_getBlockTransactionCountByHash",
  "eth_getCode",
  "eth_getStorageAt",
  "eth_getTransactionCount",
  "eth_feeHistory",
  "zks_estimateFee",
  "zks_estimateGasL1ToL2",
  "zks_getBridgehubContract",
  "zks_getMainContract",
  "zks_getTestnetPaymaster",
  "zks_getL1BatchBlockRange",
  "zks_getL1BatchDetails",
  "zks_L1BatchNumber",
  "zks_L1ChainId",
  "zks_getConfirmedTokens",
  "zks_getAllAccountBalances",
  "zks_getTransactionDetails",
  "zks_getBlockDetails",
  "zks_getBridgeContracts",
  "zks_getBaseTokenL1Address",
  "zks_getL2ToL1MsgProof",
  "zks_getL2ToL1LogProof",
  "zks_getRawBlockTransactions",
  "zks_getBytecodeByHash",
  "zks_getL1GasPrice",
  "zks_getFeeParams",
  "zks_getProtocolVersion",
  "zks_getProof",
]);

const DEFAULT_TIMEOUT_MS = 10_000;

export function assertMethodAllowed(method: string): void {
  if (BLOCKED_METHODS.has(method)) {
    throw new Error(`RPC method "${method}" is not enabled in this build.`);
  }
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error(`RPC method "${method}" is not supported in this build.`);
  }
}

export async function callAbstractRpc(input: {
  rpcUrl: string;
  method: string;
  params?: unknown[];
}): Promise<AbstractRpcSuccess> {
  assertMethodAllowed(input.method);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(input.rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: input.method,
        params: input.params ?? [],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new Error(`RPC request failed (${response.status}): ${text.slice(0, 200)}`);
    }

    const json = (await response.json()) as {
      result?: unknown;
      error?: {
        code?: number;
        message?: string;
      };
    };

    if (json.error) {
      const code = typeof json.error.code === "number" ? ` code=${json.error.code}` : "";
      throw new Error(`RPC error${code}: ${json.error.message ?? "unknown error"}`);
    }

    return { result: json.result };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`RPC request timed out after ${DEFAULT_TIMEOUT_MS}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function getAllowedMethods(): string[] {
  return [...ALLOWED_METHODS].sort();
}
