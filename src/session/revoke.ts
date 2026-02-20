import { sessionKeyValidatorAddress } from "@abstract-foundation/agw-client/constants";
import { SessionKeyValidatorAbi, getSessionHash, type SessionConfig } from "@abstract-foundation/agw-client/sessions";
import { encodeFunctionData, type Address, type Hash } from "viem";
import { createAgwActionAdapter } from "../agw/actions.js";
import { resolveNetworkConfig } from "../config/network.js";
import { assertMainnetPolicyRegistryPreflight } from "./mainnet-preflight.js";
import { createSessionClientFromSessionData } from "./client.js";
import type { AgwSessionData } from "./types.js";

function deriveSessionHash(sessionConfig: Record<string, unknown>): Hash {
  try {
    return getSessionHash(sessionConfig as unknown as SessionConfig);
  } catch {
    throw new Error("revoke rejected: session config is not compatible with AGW session hashing");
  }
}

export async function revokeSessionOnchain(
  session: AgwSessionData,
  options: { rpcUrl?: string } = {},
): Promise<{
  transactionHash: Hash;
  sessionHash: Hash;
}> {
  const sessionHash = deriveSessionHash(session.sessionConfig);
  const networkConfig = resolveNetworkConfig({
    chainId: session.chainId,
    rpcUrl: options.rpcUrl,
  });
  const data = encodeFunctionData({
    abi: SessionKeyValidatorAbi,
    functionName: "revokeKeys",
    args: [[sessionHash]],
  });

  await assertMainnetPolicyRegistryPreflight({
    chainId: session.chainId,
    to: sessionKeyValidatorAddress,
    data,
    value: 0n,
    rpcUrl: networkConfig.rpcUrl,
  });

  const sessionClient = createSessionClientFromSessionData({
    session,
    chainConfig: {
      chain: networkConfig.chain,
      rpcUrl: networkConfig.rpcUrl,
    },
  });
  const agwActions = createAgwActionAdapter(sessionClient);

  const transactionHash = await agwActions.writeContract({
    account: session.accountAddress as Address,
    chain: undefined,
    address: sessionKeyValidatorAddress,
    abi: SessionKeyValidatorAbi,
    functionName: "revokeKeys",
    args: [[sessionHash]],
  } as never);

  return {
    transactionHash: transactionHash as Hash,
    sessionHash,
  };
}
