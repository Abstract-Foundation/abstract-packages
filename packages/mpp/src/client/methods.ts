/**
 * Abstract MPP method definitions (client + server share the same schema objects).
 */

import { Method, z } from 'mppx';
import { parseUnits } from 'viem';

/**
 * Abstract charge intent — one-time ERC-3009 transfer authorization.
 *
 * The credential payload carries the ERC-3009 typed-data signature so the
 * server can call `transferWithAuthorization` on behalf of the payer.
 */
export const abstractChargeMethods = Method.from({
  name: 'abstract',
  intent: 'charge',
  schema: {
    credential: {
      payload: z.object({
        type: z.literal('authorization'),
        signature: z.signature(),
        nonce: z.hash(),
        validAfter: z.amount(),
        validBefore: z.amount(),
        from: z.address(),
      }),
    },
    request: z.pipe(
      z.object({
        amount: z.amount(),
        currency: z.string(),
        decimals: z.number(),
        recipient: z.string(),
        chainId: z.optional(z.number()),
        description: z.optional(z.string()),
      }),
      z.transform(({ amount, decimals, chainId, ...rest }) => ({
        ...rest,
        amount: parseUnits(amount, decimals).toString(),
        ...(chainId !== undefined
          ? { methodDetails: { chainId } }
          : {}),
      })),
    ),
  },
});

/**
 * Abstract session intent — payment channels backed by AbstractStreamChannel.
 */
export const abstractSessionMethods = Method.from({
  name: 'abstract',
  intent: 'session',
  schema: {
    credential: {
      payload: z.discriminatedUnion('action', [
        z.object({
          action: z.literal('open'),
          channelId: z.hash(),
          cumulativeAmount: z.amount(),
          signature: z.signature(),
          txHash: z.hash(),
          authorizedSigner: z.optional(z.string()),
        }),
        z.object({
          action: z.literal('topUp'),
          channelId: z.hash(),
          additionalDeposit: z.amount(),
          txHash: z.hash(),
        }),
        z.object({
          action: z.literal('voucher'),
          channelId: z.hash(),
          cumulativeAmount: z.amount(),
          signature: z.signature(),
        }),
        z.object({
          action: z.literal('close'),
          channelId: z.hash(),
          cumulativeAmount: z.amount(),
          signature: z.signature(),
        }),
      ]),
    },
    request: z.pipe(
      z.object({
        amount: z.amount(),
        currency: z.string(),
        decimals: z.number(),
        unitType: z.string(),
        recipient: z.optional(z.string()),
        chainId: z.optional(z.number()),
        channelId: z.optional(z.hash()),
        escrowContract: z.optional(z.string()),
        suggestedDeposit: z.optional(z.amount()),
        minVoucherDelta: z.optional(z.amount()),
      }),
      z.transform(
        ({
          amount,
          decimals,
          suggestedDeposit,
          minVoucherDelta,
          channelId,
          escrowContract,
          chainId,
          ...rest
        }) => ({
          ...rest,
          amount: parseUnits(amount, decimals).toString(),
          ...(suggestedDeposit !== undefined && {
            suggestedDeposit: parseUnits(suggestedDeposit, decimals).toString(),
          }),
          methodDetails: {
            escrowContract,
            ...(channelId !== undefined && { channelId }),
            ...(minVoucherDelta !== undefined && {
              minVoucherDelta: parseUnits(minVoucherDelta, decimals).toString(),
            }),
            ...(chainId !== undefined && { chainId }),
          },
        }),
      ),
    ),
  },
});
