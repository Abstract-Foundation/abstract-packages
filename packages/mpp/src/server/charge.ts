/**
 * Server-side charge method for the Abstract MPP payment method.
 *
 * Verifies an ERC-3009 TransferWithAuthorization signature and broadcasts
 * the `transferWithAuthorization` call to settle payment on-chain.
 *
 * When `paymasterAddress` is configured the transaction is submitted with
 * Abstract's ZKsync-native `customData.paymasterParams` — no external
 * fee-payer service required.
 */

import { Method } from "mppx";
import {
  type Account,
  type Address,
  createPublicClient,
  createWalletClient,
  erc20Abi,
  type Hex,
  http,
  type PublicClient,
  parseSignature,
  type Transport,
  type WalletClient,
} from "viem";
import { abstract, abstractTestnet } from "viem/chains";
import {
  type ChainEIP712,
  eip712WalletActions,
  getGeneralPaymasterInput,
} from "viem/zksync";
import { abstractChargeMethods } from "../client/methods.js";
import {
  DEFAULT_CURRENCY,
  ERC3009_ABI,
  ERC3009_BYTES_SIGNATURE_ABI,
  TRANSFER_WITH_AUTHORIZATION_TYPES,
  USDC_E_DECIMALS,
} from "../constants.js";
import { resolveChain } from "../internal.js";

export interface AbstractChargeServerOptions {
  /** Token address (defaults to USDC.e for the resolved chain). */
  currency?: Address;
  /** Decimals for amount conversion. Default 6. */
  decimals?: number;
  /** Server wallet that broadcasts transferWithAuthorization. */
  account: Account;
  /** Recipient address for collected payments. */
  recipient: Address;
  /** Human-readable default amount per request, e.g. "0.01". */
  amount?: string;
  /** If true, use Abstract testnet (chainId 11124). */
  testnet?: boolean;
  /** Optional custom RPC URL override. */
  rpcUrl?: string;
  /**
   * Optional Abstract paymaster contract address.
   *
   * When set, the `transferWithAuthorization` transaction is submitted with
   * ZKsync-native `customData.paymasterParams` — gas is sponsored by the
   * paymaster. No external fee-payer service is required.
   *
   * @example
   * ```ts
   * abstract.charge({
   *   paymasterAddress: '0x...', // your Abstract paymaster contract
   *   paymasterInput: '0x...', // optional custom input for your paymaster's logic
   *   ...
   * })
   * ```
   */
  paymasterAddress?: Address;
  /** Optional custom input for the paymaster's logic. */
  paymasterInput?: Hex;
}

/** Per-currency ERC-3009 domain cache to avoid redundant RPC calls. */
const domainCache = new Map<string, { name: string; version: string }>();

function isCompactSignature(signature: Hex): boolean {
  return (signature.length - 2) / 2 === 65;
}

async function getErc3009Domain(
  publicClient: PublicClient,
  currency: Address,
  chainId: number,
) {
  const cached = domainCache.get(currency);
  if (cached) return { ...cached, chainId, verifyingContract: currency };

  let name = "USD Coin";
  let version = "2";

  try {
    name = (await publicClient.readContract({
      address: currency,
      abi: erc20Abi,
      functionName: "name",
    })) as string;
  } catch {
    /* fallback */
  }

  try {
    version = (await publicClient.readContract({
      address: currency,
      abi: ERC3009_ABI,
      functionName: "version",
    })) as string;
  } catch {
    /* fallback */
  }

  domainCache.set(currency, { name, version });
  return { name, version, chainId, verifyingContract: currency };
}

/**
 * Creates a server-side Abstract charge handler using Method.toServer().
 *
 * @example
 * ```ts
 * import { Mppx } from 'mppx/server'
 * import { abstract } from '@abstract-foundation/mpp/server'
 *
 * const mppx = Mppx.create({
 *   methods: [abstract.charge({
 *     account: serverAccount,
 *     recipient: '0x...',
 *     amount: '0.01',
 *     testnet: true,
 *   })],
 *   secretKey: process.env.MPP_SECRET_KEY!,
 *   realm: 'api.example.com',
 * })
 * ```
 */
export function charge(params: AbstractChargeServerOptions) {
  const {
    account,
    recipient,
    amount,
    decimals = USDC_E_DECIMALS,
    testnet = false,
    rpcUrl,
    paymasterAddress,
    paymasterInput,
  } = params;

  const defaultChain = testnet ? abstractTestnet : abstract;
  const currency = params.currency ?? DEFAULT_CURRENCY[defaultChain.id];

  function buildClients(chainId: number): {
    publicClient: PublicClient<Transport, ChainEIP712>;
    walletClient: WalletClient<Transport, ChainEIP712, Account>;
  } {
    const chain = resolveChain(chainId);
    const transport = http(rpcUrl);
    return {
      publicClient: createPublicClient({ chain, transport }),
      walletClient: createWalletClient({ account, chain, transport }).extend(
        eip712WalletActions(),
      ),
    };
  }

  return Method.toServer(abstractChargeMethods, {
    defaults: {
      amount: amount ?? "0",
      currency,
      decimals,
      recipient,
    } as Record<string, unknown>,

    async request({ request }) {
      return { ...request, chainId: request.chainId ?? defaultChain.id };
    },

    async verify({
      credential,
      request,
    }: {
      credential: Record<string, unknown>;
      request: Record<string, unknown>;
    }) {
      const chainId =
        (request.chainId as number | undefined) ?? defaultChain.id;
      const { publicClient, walletClient } = buildClients(chainId);

      const payload = credential.payload as Record<string, unknown>;
      const challenge = credential.challenge as Record<string, unknown>;
      const challengeReq = challenge.request as Record<string, unknown>;

      const amountRaw = challengeReq.amount as string;
      const currencyAddr =
        (challengeReq.currency as Address | undefined) ?? currency;
      const recipientAddr =
        (challengeReq.recipient as Address | undefined) ?? recipient;

      if (payload.type !== "authorization") {
        throw new Error(`Unsupported credential type "${payload.type}"`);
      }

      const signature = payload.signature as Hex;
      const nonce = payload.nonce as Hex;
      const validAfter = payload.validAfter as string;
      const validBefore = payload.validBefore as string;
      const from = payload.from as Address;

      // Verify ERC-3009 signature
      const domain = await getErc3009Domain(
        publicClient,
        currencyAddr,
        chainId,
      );

      const verified = await publicClient.verifyTypedData({
        address: from,
        domain,
        types: TRANSFER_WITH_AUTHORIZATION_TYPES,
        primaryType: "TransferWithAuthorization",
        message: {
          from,
          to: recipientAddr,
          value: BigInt(amountRaw),
          validAfter: BigInt(validAfter),
          validBefore: BigInt(validBefore),
          nonce,
        },
        signature,
      });

      if (!verified) {
        throw new Error("ERC-3009 signature verification failed");
      }

      // Check nonce not already used
      const used = (await publicClient.readContract({
        address: currencyAddr,
        abi: ERC3009_ABI,
        functionName: "authorizationState",
        args: [from, nonce],
      })) as boolean;

      if (used) throw new Error("ERC-3009 authorization nonce already used");

      const baseArgs = [
        from,
        recipientAddr,
        BigInt(amountRaw),
        BigInt(validAfter),
        BigInt(validBefore),
        nonce,
      ] as const;
      const signerCode = await publicClient.getCode({ address: from });
      const isContractAccount = !!signerCode && signerCode !== "0x";

      let txHash: Hex;

      if (!isContractAccount && isCompactSignature(signature)) {
        const parsed = parseSignature(signature);
        if (!("v" in parsed)) {
          throw new Error("Expected a 65-byte ECDSA signature");
        }
        const txArgs = [
          ...baseArgs,
          Number(parsed.v),
          parsed.r,
          parsed.s,
        ] as const;

        if (paymasterAddress) {
          txHash = await walletClient.writeContract({
            account,
            address: currencyAddr,
            abi: ERC3009_ABI,
            functionName: "transferWithAuthorization",
            args: txArgs,
            ...{
              paymaster: paymasterAddress,
              paymasterInput: getGeneralPaymasterInput({
                innerInput: paymasterInput ?? "0x",
              }),
            },
          });
        } else {
          txHash = await walletClient.writeContract({
            account,
            address: currencyAddr,
            abi: ERC3009_ABI,
            functionName: "transferWithAuthorization",
            args: txArgs,
          });
        }
      } else if (paymasterAddress) {
        txHash = await walletClient.writeContract({
          account,
          address: currencyAddr,
          abi: ERC3009_BYTES_SIGNATURE_ABI,
          functionName: "transferWithAuthorization",
          args: [...baseArgs, signature],
          ...{
            paymaster: paymasterAddress,
            paymasterInput: getGeneralPaymasterInput({
              innerInput: paymasterInput ?? "0x",
            }),
          },
        });
      } else {
        txHash = await walletClient.writeContract({
          account,
          address: currencyAddr,
          abi: ERC3009_BYTES_SIGNATURE_ABI,
          functionName: "transferWithAuthorization",
          args: [...baseArgs, signature],
        });
      }

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (receipt.status !== "success") {
        throw new Error(`transferWithAuthorization reverted: ${txHash}`);
      }

      return {
        method: "abstract" as const,
        intent: "charge" as const,
        status: "success" as const,
        timestamp: new Date().toISOString(),
        reference: txHash,
      };
    },
  });
}
