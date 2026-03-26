"use client";

import { useEffect } from "react";
import SessionWizard from "@/components/SessionWizard";
import { resolveChain, type SupportedChainId } from "@/lib/chains";
import useSessionWizardStore from "@/stores/useSessionWizardStore";

export default function SessionFlowClient({
  callbackUrl,
  chainId,
  authPublicKey,
}: {
  callbackUrl: string;
  chainId: SupportedChainId;
  authPublicKey: string;
}) {
  const setChainId = useSessionWizardStore((state) => state.setChainId);
  useEffect(() => {
    setChainId(chainId);
  }, [chainId, setChainId]);

  const chain = resolveChain(chainId);

  return (
    <SessionWizard
      callbackUrl={callbackUrl}
      chain={chain}
      authPublicKey={authPublicKey}
    />
  );
}
