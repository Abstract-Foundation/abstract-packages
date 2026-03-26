"use client";

import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";

export function ConnectWallet() {
  const { login, logout } = useLoginWithAbstract();
  const { address, status } = useAccount();

  if (status === "connecting" || status === "reconnecting") {
    return (
      <div className="flex items-center justify-center w-10 h-10">
        <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (address) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-center">
          <p className="text-sm font-medium font-sans mb-1">
            Connected to Abstract Global Wallet
          </p>
          <p className="text-xs text-gray-400 font-mono truncate max-w-full">
            {address}
          </p>
        </div>
        <button
          className="rounded-lg border border-white/20 transition-colors flex items-center justify-center bg-white/10 text-white gap-2 hover:bg-white/20 cursor-pointer text-sm px-4 h-9 font-sans"
          onClick={logout}
          type="button"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      className="rounded-lg border border-accent/30 transition-colors flex items-center justify-center bg-accent/10 text-accent gap-2 hover:bg-accent/20 cursor-pointer text-sm h-10 px-5 font-sans"
      onClick={login}
      type="button"
    >
      Sign in with Abstract
    </button>
  );
}
