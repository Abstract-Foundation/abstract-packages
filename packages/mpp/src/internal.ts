import { Errors } from "mppx";
import { bytesToHex } from "viem";
import { abstract, abstractTestnet } from "viem/chains";
import type { ChainEIP712 } from "viem/zksync";

export const UINT128_MAX = 2n ** 128n - 1n;

export function resolveChain(chainId: number): ChainEIP712 {
  if (chainId === abstract.id) return abstract;
  if (chainId === abstractTestnet.id) return abstractTestnet;
  throw new Error(
    `Unsupported Abstract chainId ${chainId}, expected ${abstract.id} (mainnet) or ${abstractTestnet.id} (testnet)`,
  );
}

export function assertUint128(amount: bigint): void {
  if (amount < 0n || amount > UINT128_MAX) {
    throw new Errors.VerificationFailedError({
      reason: `cumulativeAmount exceeds uint128 range`,
    });
  }
}

export function randomBytes32(): `0x${string}` {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}
