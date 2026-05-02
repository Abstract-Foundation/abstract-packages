import { SignInWithAbstractButton } from "@abstract-foundation/agw-example-ui";
import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";

export function SignInButton() {
  const { login } = useLoginWithAbstract();
  const { status } = useAccount();

  return (
    <SignInWithAbstractButton
      onClick={login}
      isLoading={status === "connecting" || status === "reconnecting"}
    />
  );
}
