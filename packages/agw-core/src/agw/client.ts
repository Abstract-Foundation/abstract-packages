import {
  createAbstractClient,
  type AbstractClient,
} from "@abstract-foundation/agw-client";
import { custom, http, type Address, type EIP1193RequestFn } from "viem";
import type { ChainEIP712 } from "viem/chains";
import type { PrivyWalletClient } from "../privy/client.js";

export type { AbstractClient } from "@abstract-foundation/agw-client";

function createPrivyEip1193Provider(
  privyClient: PrivyWalletClient,
  chainId: number,
  rpcUrl: string,
): EIP1193RequestFn {
  return (async ({ method, params }) => {
    switch (method) {
      case "eth_signTypedData_v4": {
        const typedData = (params as [string, string])[1];
        return privyClient.signTypedData(chainId, typedData);
      }
      case "personal_sign": {
        const message = (params as [string, string])[0];
        return privyClient.signMessage(chainId, message);
      }
      default: {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        });
        const result = (await response.json()) as { error?: { message: string }; result?: unknown };
        if (result.error) {
          throw new Error(result.error.message);
        }
        return result.result;
      }
    }
  }) as EIP1193RequestFn;
}

export interface CreateAgwAbstractClientOptions {
  privyClient: PrivyWalletClient;
  signerAddress: Address;
  accountAddress: Address;
  chain: ChainEIP712;
  chainId: number;
  rpcUrl: string;
}

export async function createAgwAbstractClient(
  options: CreateAgwAbstractClientOptions,
): Promise<AbstractClient> {
  const provider = createPrivyEip1193Provider(
    options.privyClient,
    options.chainId,
    options.rpcUrl,
  );

  return createAbstractClient({
    signer: { address: options.signerAddress, type: "json-rpc" },
    chain: options.chain,
    transport: custom({ request: provider }),
    address: options.accountAddress,
    publicTransport: http(options.rpcUrl),
    isPrivyCrossApp: false,
  });
}
