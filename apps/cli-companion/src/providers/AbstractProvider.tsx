"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { Chain } from "viem/chains";
import { abstract } from "viem/chains";

export default function AbstractProvider({
  chain,
  children,
}: {
  chain?: Chain;
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

  if (!appId || !clientId) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        supportedChains: [chain ?? abstract],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
