/**
 * Client-side charge credential creator for the Abstract MPP payment method.
 *
 * The client signs an ERC-3009 `TransferWithAuthorization` typed-data message.
 * No transaction is sent from the client side — the server broadcasts the
 * `transferWithAuthorization` call on behalf of the payer.
 */

import { Credential, Method } from "mppx";
import {
  type Account,
  type Address,
  createPublicClient,
  createWalletClient,
  erc20Abi,
  http,
  type PublicClient,
  type Transport,
  type WalletClient,
} from "viem";
import type { ChainEIP712 } from "viem/zksync";
import {
  ERC3009_ABI,
  TRANSFER_WITH_AUTHORIZATION_TYPES,
} from "../constants.js";
import { randomBytes32, resolveChain } from "../internal.js";
import { abstractChargeMethods } from "./methods.js";

async function getErc3009Domain(
  publicClient: PublicClient,
  currency: Address,
  chainId: number,
) {
  let name = "USD Coin";
  let version = "2";

  try {
    name = (await publicClient.readContract({
      address: currency,
      abi: erc20Abi,
      functionName: "name",
    })) as string;
  } catch {
    /* fallback to USDC defaults */
  }

  try {
    version = (await publicClient.readContract({
      address: currency,
      abi: ERC3009_ABI,
      functionName: "version",
    })) as string;
  } catch {
    /* fallback to USDC defaults */
  }

  return { name, version, chainId, verifyingContract: currency };
}

export interface AbstractChargeClientOptions {
  /** Viem account to sign ERC-3009 authorizations. */
  account: Account;
  /** Optional custom RPC URL override. */
  rpcUrl?: string;
  /** Override the viem wallet client factory (advanced). */
  getClient?: (chainId: number) => WalletClient | Promise<WalletClient>;
}

/**
 * Creates a client-side Abstract charge method that signs ERC-3009
 * `TransferWithAuthorization` typed data without broadcasting a transaction.
 *
 * @example
 * ```ts
 * import { abstractCharge } from '@abstract-foundation/mpp/client'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const charge = abstractCharge({ account: privateKeyToAccount('0x...') })
 * ```
 */
export function abstractCharge(options: AbstractChargeClientOptions) {
  const { account, getClient: customGetClient, rpcUrl } = options;

  function buildClient(chainId: number): {
    walletClient: WalletClient<Transport, ChainEIP712, Account>;
    publicClient: PublicClient<Transport, ChainEIP712>;
  } {
    const chain = resolveChain(chainId);
    const transport = http(rpcUrl);
    return {
      walletClient: createWalletClient({ account, chain, transport }),
      publicClient: createPublicClient({ chain, transport }),
    };
  }

  async function resolveWalletClient(chainId: number): Promise<WalletClient> {
    if (customGetClient) return customGetClient(chainId);
    return buildClient(chainId).walletClient;
  }

  return Method.toClient(abstractChargeMethods, {
    async createCredential({
      challenge,
    }: {
      challenge: Record<string, unknown>;
    }) {
      const methodDetails = (challenge.request as Record<string, unknown>)
        .methodDetails as Record<string, unknown> | undefined;
      const chainId =
        (methodDetails?.chainId as number | undefined) ??
        ((challenge.request as Record<string, unknown>).chainId as
          | number
          | undefined) ??
        resolveChain(2741).id;

      const walletClient = await resolveWalletClient(chainId);

      const req = challenge.request as Record<string, unknown>;
      const currency = req.currency as Address;
      const recipient = req.recipient as Address;
      const amountRaw = req.amount as string;

      const nonce = randomBytes32();

      const validAfter = 0n;
      const expiresStr = challenge.expires as string | undefined;
      const validBefore = expiresStr
        ? BigInt(Math.floor(new Date(expiresStr).getTime() / 1000))
        : BigInt(Math.floor(Date.now() / 1000) + 1800);

      const { publicClient } = buildClient(chainId);
      const domain = await getErc3009Domain(publicClient, currency, chainId);

      const signature = await walletClient.signTypedData({
        account,
        domain,
        types: TRANSFER_WITH_AUTHORIZATION_TYPES,
        primaryType: "TransferWithAuthorization",
        message: {
          from: account.address as Address,
          to: recipient,
          value: BigInt(amountRaw),
          validAfter,
          validBefore,
          nonce,
        },
      });

      const source = `did:pkh:eip155:${chainId}:${account.address}`;

      return Credential.serialize({
        challenge: challenge as Parameters<
          typeof Credential.serialize
        >[0]["challenge"],
        source,
        payload: {
          type: "authorization" as const,
          signature,
          nonce,
          validAfter: validAfter.toString(),
          validBefore: validBefore.toString(),
          from: account.address as Address,
        },
      });
    },
  });
}
