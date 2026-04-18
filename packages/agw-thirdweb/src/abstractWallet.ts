import {
  type CustomPaymasterHandler,
  transformEIP1193Provider,
  validChains,
} from "@abstract-foundation/agw-client";
import { toPrivyWalletProvider } from "@privy-io/cross-app-connect";
import { EIP1193, type Wallet } from "thirdweb/wallets";
import type { Chain } from "viem";

const AGW_APP_ID = "cm04asygd041fmry9zmcyn5o5";
const AGW_WALLET_ID = "xyz.abs";

interface AbstractWalletOptions {
  /** Optional custom paymaster handler used to sponsor gas for user transactions. */
  customPaymasterHandler?: CustomPaymasterHandler;
}

/**
 * Create a thirdweb wallet for Abstract Global Wallet (AGW).
 *
 * This returns a thirdweb `Wallet` that can be passed to `ConnectButton`, the
 * `useConnect` hook, or any other thirdweb Connect SDK surface. Under the hood
 * it builds a minimal EIP-1193 provider via `@privy-io/cross-app-connect` and
 * wraps it with the AGW smart-account transform from `@abstract-foundation/agw-client`.
 *
 * @example
 * ```tsx
 * import { createThirdwebClient } from "thirdweb";
 * import { ConnectButton } from "thirdweb/react";
 * import { abstractWallet } from "@abstract-foundation/agw-thirdweb";
 *
 * const client = createThirdwebClient({ clientId });
 *
 * export function Connect() {
 *   return <ConnectButton client={client} wallets={[abstractWallet()]} />;
 * }
 * ```
 */
function abstractWallet(options: AbstractWalletOptions = {}): Wallet {
  const { customPaymasterHandler } = options;
  const chains = Object.values(validChains) as [Chain, ...Chain[]];

  return EIP1193.fromProvider({
    walletId: AGW_WALLET_ID,
    provider: async ({ chainId } = {}) => {
      const targetChainId = chainId ?? chains[0].id;
      const chain = chains.find((c) => c.id === targetChainId) ?? chains[0];

      const privyProvider = toPrivyWalletProvider({
        providerAppId: AGW_APP_ID,
        chains,
        chainId: targetChainId,
      });

      return transformEIP1193Provider({
        provider: privyProvider,
        chain,
        isPrivyCrossApp: true,
        customPaymasterHandler,
      });
    },
  });
}

export { type AbstractWalletOptions, abstractWallet };
