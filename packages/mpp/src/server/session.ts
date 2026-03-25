/**
 * Server-side session method for the Abstract MPP payment method.
 *
 * Handles the full channel lifecycle against AbstractStreamChannel.sol.
 */

import { Errors, Method, Store } from 'mppx';
import {
  type Account,
  type Address,
  createPublicClient,
  createWalletClient,
  type Hex,
  http,
  isAddressEqual,
  type PublicClient,
  parseUnits,
  type Transport,
  type WalletClient,
  zeroAddress,
} from 'viem';
import { verifyTypedData } from 'viem/actions';
import { abstract, abstractTestnet } from 'viem/chains';
import {
  type ChainEIP712,
  eip712WalletActions,
  getGeneralPaymasterInput,
} from 'viem/zksync';
import { abstractSessionMethods } from '../client/methods.js';
import {
  ABSTRACT_STREAM_CHANNEL_ABI,
  DEFAULT_CURRENCY,
  DEFAULT_ESCROW,
  USDC_E_DECIMALS,
  VOUCHER_DOMAIN_NAME,
  VOUCHER_DOMAIN_VERSION,
  VOUCHER_TYPES,
} from '../constants.js';
import { assertUint128, resolveChain } from '../internal.js';

// ── Types ─────────────────────────────────────────────────────────────────

interface VoucherRecord {
  channelId: Hex;
  cumulativeAmount: bigint;
  signature: Hex;
}

interface ChannelState {
  channelId: Hex;
  chainId: number;
  escrowContract: Address;
  payer: Address;
  payee: Address;
  token: Address;
  authorizedSigner: Address;
  deposit: bigint;
  settledOnChain: bigint;
  highestVoucherAmount: bigint;
  highestVoucher: VoucherRecord | null;
  spent: bigint;
  units: number;
  finalized: boolean;
  createdAt: string;
}

// ── ChannelStore ──────────────────────────────────────────────────────────

interface ChannelStore {
  getChannel(channelId: Hex): Promise<ChannelState | null>;
  updateChannel(
    channelId: Hex,
    fn: (current: ChannelState | null) => ChannelState | null,
  ): Promise<ChannelState | null>;
}

function channelStoreFromStore(store: Store.Store): ChannelStore {
  const locks = new Map<string, Promise<void>>();

  async function update(
    channelId: Hex,
    fn: (current: ChannelState | null) => ChannelState | null,
  ): Promise<ChannelState | null> {
    while (locks.has(channelId)) await locks.get(channelId);

    let release!: () => void;
    locks.set(
      channelId,
      new Promise<void>((r) => {
        release = r;
      }),
    );

    try {
      const current = (await store.get(channelId)) as ChannelState | null;
      const next = fn(current);
      if (next) await store.put(channelId, next as never);
      else await store.delete(channelId);
      return next;
    } finally {
      locks.delete(channelId);
      release();
    }
  }

  return {
    async getChannel(channelId) {
      return (await store.get(channelId)) as ChannelState | null;
    },
    async updateChannel(channelId, fn) {
      return update(channelId, fn);
    },
  };
}

// ── Options ────────────────────────────────────────────────────────────────

export interface AbstractSessionServerOptions {
  /** Server account (broadcasts close/settle transactions). */
  account: Account;
  /** Payment recipient. */
  recipient: Address;
  /** Token address (defaults to USDC.e for the chain). */
  currency?: Address;
  /** AbstractStreamChannel escrow contract address. Defaults to the canonical deployment. */
  escrowContract?: Address;
  /** Per-request payment amount (human-readable, e.g. "0.001"). */
  amount?: string;
  /** Suggested deposit for clients (human-readable). */
  suggestedDeposit?: string;
  /** Minimum voucher increment. Default "0". */
  minVoucherDelta?: string;
  /** Unit type label (e.g. "request", "token"). */
  unitType?: string;
  /** Decimals for amount conversion. Default 6. */
  decimals?: number;
  /** Use testnet (chainId 11124). */
  testnet?: boolean;
  /** Custom RPC URL. */
  rpcUrl?: string;
  /** Optional paymaster address. */
  paymasterAddress?: Address;
  /** Optional custom input for the paymaster's logic. */
  paymasterInput?: Hex;
  /** Store backend for channel state. Defaults to Store.memory(). */
  store?: Store.Store;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function verifyVoucherSig(
  publicClient: PublicClient,
  escrowContract: Address,
  chainId: number,
  voucher: VoucherRecord,
  expectedSigner: Address,
): Promise<boolean> {
  try {
    return await verifyTypedData(publicClient, {
      address: expectedSigner,
      domain: {
        name: VOUCHER_DOMAIN_NAME,
        version: VOUCHER_DOMAIN_VERSION,
        chainId,
        verifyingContract: escrowContract,
      },
      types: VOUCHER_TYPES,
      primaryType: 'Voucher',
      message: {
        channelId: voucher.channelId,
        cumulativeAmount: voucher.cumulativeAmount,
      },
      signature: voucher.signature,
    });
  } catch {
    return false;
  }
}

function makeSessionReceipt(params: {
  challengeId: string;
  channelId: Hex;
  acceptedCumulative: bigint;
  spent: bigint;
  units: number;
  txHash?: Hex;
}) {
  return {
    method: 'abstract' as const,
    intent: 'session' as const,
    status: 'success' as const,
    timestamp: new Date().toISOString(),
    reference: params.txHash ?? params.channelId,
    channelId: params.channelId,
    acceptedCumulative: params.acceptedCumulative.toString(),
    spent: params.spent.toString(),
    units: params.units,
    challengeId: params.challengeId,
  };
}

// ── Main export ────────────────────────────────────────────────────────────

/**
 * Creates a server-side Abstract session handler.
 *
 * @example
 * ```ts
 * import { Mppx } from 'mppx/server'
 * import { abstract } from '@abstract-foundation/mpp/server'
 *
 * const mppx = Mppx.create({
 *   methods: [abstract.session({
 *     account: serverAccount,
 *     recipient: '0x...',
 *     escrowContract: '0x...',
 *     amount: '0.001',
 *     suggestedDeposit: '1',
 *     unitType: 'request',
 *     testnet: true,
 *   })],
 *   secretKey: process.env.MPP_SECRET_KEY!,
 * })
 * ```
 */
export function session(params: AbstractSessionServerOptions) {
  const {
    account,
    recipient,
    amount,
    suggestedDeposit,
    minVoucherDelta = '0',
    unitType = 'request',
    decimals = USDC_E_DECIMALS,
    testnet = false,
    rpcUrl,
    paymasterAddress,
    paymasterInput,
  } = params;

  const defaultChain = testnet ? abstractTestnet : abstract;
  const escrowContract = params.escrowContract ?? DEFAULT_ESCROW[defaultChain.id];
  const currency = params.currency ?? DEFAULT_CURRENCY[defaultChain.id];
  const minDelta = parseUnits(minVoucherDelta, decimals);
  const channelStore = channelStoreFromStore(
    params.store ?? Store.memory(),
  );

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

  async function getOnChainChannel(
    publicClient: PublicClient<Transport, ChainEIP712>,
    channelId: Hex,
  ) {
    return publicClient.readContract({
      address: escrowContract,
      abi: ABSTRACT_STREAM_CHANNEL_ABI,
      functionName: 'getChannel',
      args: [channelId],
    });
  }

  return Method.toServer(abstractSessionMethods, {
    defaults: {
      amount: amount ?? '0',
      currency,
      decimals,
      recipient,
      suggestedDeposit,
      unitType,
      escrowContract,
    } as Record<string, unknown>,

    async request({ request }) {
      return {
        ...request,
        chainId: request.chainId ?? defaultChain.id,
        escrowContract: request.escrowContract ?? escrowContract,
      };
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
      const challengeAmount = BigInt(challengeReq.amount as string);

      const action = payload.action as string;

      switch (action) {
        // ── OPEN ────────────────────────────────────────────────────────────
        case 'open': {
          const channelId = payload.channelId as Hex;
          const cumulativeAmount = BigInt(payload.cumulativeAmount as string);
          const signature = payload.signature as Hex;
          const txHash = payload.txHash as Hex;

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
          });
          if (receipt.status !== 'success') {
            throw new Errors.VerificationFailedError({
              reason: `open transaction reverted: ${txHash}`,
            });
          }

          const onChain = await getOnChainChannel(publicClient, channelId);
          if (onChain.deposit === 0n)
            throw new Errors.ChannelNotFoundError({
              reason: 'channel not funded on-chain',
            });
          if (onChain.finalized)
            throw new Errors.ChannelClosedError({
              reason: 'channel is finalized',
            });
          if (onChain.closeRequestedAt !== 0n)
            throw new Errors.ChannelClosedError({
              reason: 'channel has a pending close request',
            });
          if (!isAddressEqual(onChain.payee, recipient)) {
            throw new Errors.VerificationFailedError({
              reason: 'on-chain payee mismatch',
            });
          }
          if (!isAddressEqual(onChain.token, currency)) {
            throw new Errors.VerificationFailedError({
              reason: 'on-chain token mismatch',
            });
          }

          const authorizedSigner = isAddressEqual(
            onChain.authorizedSigner,
            zeroAddress,
          )
            ? onChain.payer
            : onChain.authorizedSigner;

          assertUint128(cumulativeAmount);

          if (cumulativeAmount > onChain.deposit) {
            throw new Errors.AmountExceedsDepositError({
              reason: 'voucher exceeds deposit',
            });
          }

          const voucher: VoucherRecord = {
            channelId,
            cumulativeAmount,
            signature,
          };
          const valid = await verifyVoucherSig(
            publicClient,
            escrowContract,
            chainId,
            voucher,
            authorizedSigner,
          );
          if (!valid)
            throw new Errors.InvalidSignatureError({
              reason: 'invalid voucher signature',
            });

          const state: ChannelState = {
            channelId,
            chainId,
            escrowContract,
            payer: onChain.payer,
            payee: onChain.payee,
            token: onChain.token,
            authorizedSigner,
            deposit: onChain.deposit,
            settledOnChain: onChain.settled,
            highestVoucherAmount: cumulativeAmount,
            highestVoucher: voucher,
            spent: challengeAmount,
            units: 1,
            finalized: false,
            createdAt: new Date().toISOString(),
          };
          await channelStore.updateChannel(channelId, () => state);

          return makeSessionReceipt({
            challengeId: challenge.id as string,
            channelId,
            acceptedCumulative: cumulativeAmount,
            spent: state.spent,
            units: state.units,
            txHash,
          });
        }

        // ── TOPUP ───────────────────────────────────────────────────────────
        case 'topUp': {
          const channelId = payload.channelId as Hex;
          const txHash = payload.txHash as Hex;

          const state = await channelStore.getChannel(channelId);
          if (!state)
            throw new Errors.ChannelNotFoundError({
              reason: 'channel not found',
            });

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
          });
          if (receipt.status !== 'success') {
            throw new Errors.VerificationFailedError({
              reason: `topUp transaction reverted: ${txHash}`,
            });
          }

          const onChain = await getOnChainChannel(publicClient, channelId);
          if (onChain.deposit <= state.deposit) {
            throw new Errors.VerificationFailedError({
              reason: 'channel deposit did not increase',
            });
          }

          const updated = await channelStore.updateChannel(
            channelId,
            (current) => {
              if (!current) return null;
              return { ...current, deposit: onChain.deposit };
            },
          );

          return makeSessionReceipt({
            challengeId: challenge.id as string,
            channelId,
            acceptedCumulative: updated?.highestVoucherAmount ?? 0n,
            spent: updated?.spent ?? 0n,
            units: updated?.units ?? 0,
            txHash,
          });
        }

        // ── VOUCHER ─────────────────────────────────────────────────────────
        case 'voucher': {
          const channelId = payload.channelId as Hex;
          const cumulativeAmount = BigInt(payload.cumulativeAmount as string);
          const signature = payload.signature as Hex;

          const state = await channelStore.getChannel(channelId);
          if (!state)
            throw new Errors.ChannelNotFoundError({
              reason: 'channel not found',
            });
          if (state.finalized)
            throw new Errors.ChannelClosedError({
              reason: 'channel is finalized',
            });

          if (cumulativeAmount <= state.highestVoucherAmount) {
            return makeSessionReceipt({
              challengeId: challenge.id as string,
              channelId,
              acceptedCumulative: state.highestVoucherAmount,
              spent: state.spent,
              units: state.units,
            });
          }

          assertUint128(cumulativeAmount);

          const delta = cumulativeAmount - state.highestVoucherAmount;
          if (delta < minDelta) {
            throw new Errors.DeltaTooSmallError({
              reason: `delta ${delta} below minimum ${minDelta}`,
            });
          }
          if (cumulativeAmount > state.deposit) {
            throw new Errors.AmountExceedsDepositError({
              reason: 'voucher exceeds deposit',
            });
          }

          const voucher: VoucherRecord = {
            channelId,
            cumulativeAmount,
            signature,
          };
          const valid = await verifyVoucherSig(
            publicClient,
            escrowContract,
            chainId,
            voucher,
            state.authorizedSigner,
          );
          if (!valid)
            throw new Errors.InvalidSignatureError({
              reason: 'invalid voucher signature',
            });

          const updated = await channelStore.updateChannel(
            channelId,
            (current) => {
              if (!current) return null;
              return {
                ...current,
                highestVoucherAmount: cumulativeAmount,
                highestVoucher: voucher,
                spent: current.spent + challengeAmount,
                units: current.units + 1,
              };
            },
          );

          return makeSessionReceipt({
            challengeId: challenge.id as string,
            channelId,
            acceptedCumulative: cumulativeAmount,
            spent: updated?.spent ?? 0n,
            units: updated?.units ?? 0,
          });
        }

        // ── CLOSE ───────────────────────────────────────────────────────────
        case 'close': {
          const channelId = payload.channelId as Hex;
          const cumulativeAmount = BigInt(payload.cumulativeAmount as string);
          const signature = payload.signature as Hex;

          const state = await channelStore.getChannel(channelId);
          if (!state)
            throw new Errors.ChannelNotFoundError({
              reason: 'channel not found',
            });
          if (state.finalized)
            throw new Errors.ChannelClosedError({
              reason: 'channel already finalized',
            });

          assertUint128(cumulativeAmount);

          const minClose =
            state.spent > state.settledOnChain
              ? state.spent
              : state.settledOnChain;
          if (cumulativeAmount < minClose) {
            throw new Errors.VerificationFailedError({
              reason: `close voucher amount must be >= ${minClose} (max of spent and on-chain settled)`,
            });
          }
          if (cumulativeAmount > state.deposit) {
            throw new Errors.AmountExceedsDepositError({
              reason: 'close amount exceeds deposit',
            });
          }

          const voucher: VoucherRecord = {
            channelId,
            cumulativeAmount,
            signature,
          };
          const valid = await verifyVoucherSig(
            publicClient,
            escrowContract,
            chainId,
            voucher,
            state.authorizedSigner,
          );
          if (!valid)
            throw new Errors.InvalidSignatureError({
              reason: 'invalid close voucher signature',
            });

          const closeArgs = [channelId, cumulativeAmount, signature] as const;

          let txHash: Hex;
          if (paymasterAddress) {
            txHash = await walletClient.writeContract({
              account,
              address: escrowContract,
              abi: ABSTRACT_STREAM_CHANNEL_ABI,
              functionName: 'close',
              args: closeArgs,
              chain: null,
              ...{
                paymaster: paymasterAddress,
                paymasterInput: getGeneralPaymasterInput({
                  innerInput: paymasterInput ?? '0x',
                }),
              },
            });
          } else {
            txHash = await walletClient.writeContract({
              account,
              address: escrowContract,
              abi: ABSTRACT_STREAM_CHANNEL_ABI,
              functionName: 'close',
              args: closeArgs,
              chain: null,
            });
          }

          const closeReceipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
          });
          if (closeReceipt.status !== 'success') {
            throw new Errors.VerificationFailedError({
              reason: `close transaction reverted: ${txHash}`,
            });
          }

          await channelStore.updateChannel(channelId, (current) => {
            if (!current) return null;
            return {
              ...current,
              highestVoucherAmount: cumulativeAmount,
              highestVoucher: voucher,
              finalized: true,
            };
          });

          return makeSessionReceipt({
            challengeId: challenge.id as string,
            channelId,
            acceptedCumulative: cumulativeAmount,
            spent: state.spent,
            units: state.units,
            txHash,
          });
        }

        default:
          throw new Errors.BadRequestError({
            reason: `unknown session action: ${action}`,
          });
      }
    },

    respond({ credential, input }) {
      const action = (credential.payload as Record<string, unknown>)
        .action as string;

      if (action === 'close' || action === 'topUp') {
        return new Response(null, { status: 204 });
      }

      if (input.method === 'POST') {
        const contentLength = input.headers.get('content-length');
        if (contentLength !== null && contentLength !== '0') return undefined;
        if (input.headers.has('transfer-encoding')) return undefined;
        return new Response(null, { status: 204 });
      }

      return undefined;
    },
  });
}
