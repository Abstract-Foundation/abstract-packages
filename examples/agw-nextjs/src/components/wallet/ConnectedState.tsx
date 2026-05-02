import { ConnectedWalletCard } from "@abstract-foundation/agw-example-ui";
import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";
import { SendTransaction } from "./SendTransaction";

export function ConnectedState() {
  const { address } = useAccount();
  const { logout } = useLoginWithAbstract();

  if (!address) return null;

  return (
    <ConnectedWalletCard address={address} onDisconnect={logout}>
      <SendTransaction />
    </ConnectedWalletCard>
  );
}
