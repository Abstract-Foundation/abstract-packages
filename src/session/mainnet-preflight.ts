import { createPublicClient, http, zeroAddress, type Address, type Hex } from "viem";
import { abstract } from "viem/chains";
import { createMcpToolError } from "../errors/contract.js";
import { resolveNetworkConfig } from "../config/network.js";

const SESSION_KEY_POLICY_REGISTRY_ADDRESS = "0xfD20b9d7A406e2C4f5D6Df71ABE3Ee48B2EccC9F";
const SELECTOR_LENGTH = 10;

const SessionKeyPolicyRegistryAbi = [
  {
    type: "function",
    name: "getCallPolicyStatus",
    stateMutability: "view",
    inputs: [
      { name: "target", type: "address" },
      { name: "selector", type: "bytes4" },
    ],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "getTransferPolicyStatus",
    stateMutability: "view",
    inputs: [{ name: "target", type: "address" }],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

export enum MainnetPolicyRegistryStatus {
  Unset = 0,
  Allowed = 1,
  Denied = 2,
}

export interface MainnetPolicyRegistryPreflightInput {
  chainId: number;
  to: Address;
  data: Hex;
  value: bigint;
  rpcUrl?: string;
}

export interface MainnetPolicyRegistryPreflightDependencies {
  createClient?: (rpcUrl: string) => {
    readContract: (args: Record<string, unknown>) => Promise<unknown>;
  };
}

function defaultCreateClient(rpcUrl: string): {
  readContract: (args: Record<string, unknown>) => Promise<unknown>;
} {
  return createPublicClient({
    chain: abstract,
    transport: http(rpcUrl),
  }) as unknown as {
    readContract: (args: Record<string, unknown>) => Promise<unknown>;
  };
}

function statusLabel(status: MainnetPolicyRegistryStatus): string {
  if (status === MainnetPolicyRegistryStatus.Unset) {
    return "Unset";
  }
  if (status === MainnetPolicyRegistryStatus.Allowed) {
    return "Allowed";
  }
  return "Denied";
}

function parseStatus(value: unknown): MainnetPolicyRegistryStatus {
  const numeric = Number(value);
  if (
    numeric !== MainnetPolicyRegistryStatus.Unset &&
    numeric !== MainnetPolicyRegistryStatus.Allowed &&
    numeric !== MainnetPolicyRegistryStatus.Denied
  ) {
    throw createMcpToolError("AGW_POLICY_REGISTRY_INVALID_STATUS", "mainnet policy registry returned an unknown status", {
      status: value,
    });
  }

  return numeric;
}

export async function assertMainnetPolicyRegistryPreflight(
  input: MainnetPolicyRegistryPreflightInput,
  dependencies: MainnetPolicyRegistryPreflightDependencies = {},
): Promise<void> {
  if (input.chainId !== abstract.id) {
    return;
  }

  const networkConfig = resolveNetworkConfig({
    chainId: input.chainId,
    rpcUrl: input.rpcUrl,
  });
  if (!networkConfig.rpcUrl) {
    throw createMcpToolError(
      "AGW_POLICY_REGISTRY_RPC_REQUIRED",
      "mainnet policy registry preflight requires an RPC URL",
      { chainId: input.chainId },
    );
  }

  const clientFactory = dependencies.createClient ?? defaultCreateClient;
  const client = clientFactory(networkConfig.rpcUrl);
  const selector = input.data.length >= SELECTOR_LENGTH ? (input.data.slice(0, SELECTOR_LENGTH) as Hex) : null;

  if (selector) {
    const callStatusRaw = await client.readContract({
      address: SESSION_KEY_POLICY_REGISTRY_ADDRESS,
      abi: SessionKeyPolicyRegistryAbi,
      functionName: "getCallPolicyStatus",
      args: [input.to, selector],
    });
    const callStatus = parseStatus(callStatusRaw);
    if (callStatus !== MainnetPolicyRegistryStatus.Allowed) {
      throw createMcpToolError("AGW_POLICY_REGISTRY_CALL_BLOCKED", "mainnet call policy registry check failed", {
        target: input.to,
        selector,
        status: callStatus,
        statusLabel: statusLabel(callStatus),
      });
    }
  }

  if (input.value > 0n) {
    const transferStatusRaw = await client.readContract({
      address: SESSION_KEY_POLICY_REGISTRY_ADDRESS,
      abi: SessionKeyPolicyRegistryAbi,
      functionName: "getTransferPolicyStatus",
      args: [zeroAddress],
    });
    const transferStatus = parseStatus(transferStatusRaw);
    if (transferStatus !== MainnetPolicyRegistryStatus.Allowed) {
      throw createMcpToolError("AGW_POLICY_REGISTRY_TRANSFER_BLOCKED", "mainnet transfer policy registry check failed", {
        target: zeroAddress,
        status: transferStatus,
        statusLabel: statusLabel(transferStatus),
      });
    }
  }
}
