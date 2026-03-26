"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ChargeDemo } from "@/components/demo/charge-demo";
import { MintTokens } from "@/components/demo/mint-tokens";
import { SessionDemo } from "@/components/demo/session-demo";
import { ConnectWallet } from "@/components/wallet/connect-wallet";

type Tab = "charge" | "session";

const ESCROW_CONTRACT = process.env.NEXT_PUBLIC_ESCROW_CONTRACT;

export function DemoPanel() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("charge");

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm w-full h-full">
      <h2 className="text-lg font-semibold font-mono text-accent mb-4 text-center">
        Live Demo
      </h2>

      <div className="flex flex-col items-center gap-5">
        {/* Step 1: Connect */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 font-sans mb-1">
            Step 1: Connect Wallet
          </span>
          <ConnectWallet />
        </div>

        {address && (
          <>
            {/* Step 2: Mint */}
            <div className="w-full h-px bg-white/10" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 font-sans mb-1">
                Step 2: Get Test Tokens
              </span>
              <MintTokens />
            </div>

            {/* Step 3: Pay */}
            <div className="w-full h-px bg-white/10" />
            <div className="flex flex-col items-center gap-1 w-full">
              <span className="text-xs text-gray-500 font-sans mb-1">
                Step 3: Make Paid API Call
              </span>

              {/* Tabs */}
              <div className="flex w-full rounded-lg overflow-hidden border border-white/10 mb-3">
                <button
                  className={`flex-1 text-xs font-mono py-2 transition-colors ${
                    activeTab === "charge"
                      ? "bg-accent/20 text-accent"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                  onClick={() => setActiveTab("charge")}
                  type="button"
                >
                  Charge
                </button>
                <button
                  className={`flex-1 text-xs font-mono py-2 transition-colors ${
                    activeTab === "session"
                      ? "bg-accent/20 text-accent"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  } ${!ESCROW_CONTRACT ? "opacity-40 cursor-not-allowed" : ""}`}
                  onClick={() => ESCROW_CONTRACT && setActiveTab("session")}
                  disabled={!ESCROW_CONTRACT}
                  type="button"
                >
                  Session
                </button>
              </div>

              {activeTab === "charge" && <ChargeDemo />}
              {activeTab === "session" && <SessionDemo />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
