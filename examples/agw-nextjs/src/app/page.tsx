"use client";

import { ExamplePage } from "@abstract-foundation/agw-example-ui";
import { useAccount } from "wagmi";
import { ConnectedState } from "@/components/wallet/ConnectedState";
import { SignInButton } from "@/components/wallet/SignInButton";

export default function Home() {
  const { address } = useAccount();

  return (
    <ExamplePage>{address ? <ConnectedState /> : <SignInButton />}</ExamplePage>
  );
}
