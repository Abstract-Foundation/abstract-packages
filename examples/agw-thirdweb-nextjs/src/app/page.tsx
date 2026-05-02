"use client";

import {
  abstractLogo,
  ConnectedWalletCard,
  ExamplePage,
  SubmitTransactionButton,
  thirdwebLogo,
} from "@abstract-foundation/agw-example-ui";
import { abstractWallet } from "@abstract-foundation/agw-thirdweb";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
} from "thirdweb";
import { abstractTestnet } from "thirdweb/chains";
import {
  ConnectButton,
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
  useSendTransaction,
} from "thirdweb/react";
import type { Address } from "viem";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ?? "",
});

const wallets = [abstractWallet()];
const logos = [
  {
    src: abstractLogo,
    alt: "Abstract logo",
    width: 240,
    height: 32,
  },
  {
    src: thirdwebLogo,
    alt: "Thirdweb logo",
    width: 32,
    height: 32,
  },
] as const;

export default function Home() {
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const { disconnect } = useDisconnect();
  const { mutateAsync: sendTransaction } = useSendTransaction();

  const submitTransaction = async () => {
    if (!account?.address) return;

    const contract = getContract({
      address: "0xC4822AbB9F05646A9Ce44EFa6dDcda0Bf45595AA",
      chain: abstractTestnet,
      client,
    });

    const contractCall = prepareContractCall({
      contract,
      method: "function mint(address,uint256)",
      params: [account.address as Address, BigInt(1)],
    });

    await sendTransaction(contractCall);
  };

  return (
    <ExamplePage logos={logos}>
      {wallet !== undefined ? (
        <ConnectedWalletCard
          address={account?.address ?? ""}
          explorerHref={
            account?.address
              ? `https://explorer.testnet.abs.xyz/address/${account.address}`
              : undefined
          }
          onDisconnect={() => disconnect(wallet)}
        >
          <SubmitTransactionButton
            onClick={submitTransaction}
            disabled={!account?.address}
          />
        </ConnectedWalletCard>
      ) : (
        <ConnectButton
          client={client}
          showAllWallets={false}
          wallets={wallets}
          accountAbstraction={{
            chain: abstractTestnet,
            sponsorGas: true,
          }}
        />
      )}
    </ExamplePage>
  );
}
