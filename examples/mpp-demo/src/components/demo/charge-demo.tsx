"use client";

import { useState } from "react";
import type { Account, Transport, WalletClient } from "viem";
import type { ChainEIP712 } from "viem/zksync";
import { useAccount, useWalletClient } from "wagmi";
import { CHARGE_AMOUNT } from "@/lib/constants";
import { createChargeClient } from "@/lib/mpp-client";

interface ChargeResponse {
  message: string;
  timestamp: string;
  fact: string;
  intent: string;
  chain: string;
}

interface ReceiptData {
  txHash?: string;
  raw: string;
}

function parseReceipt(header: string | null): ReceiptData | null {
  if (!header) return null;
  try {
    const payload = header.startsWith("Payment ")
      ? header.slice("Payment ".length)
      : header;
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(decoded);
    return { txHash: parsed.transaction ?? parsed.txHash, raw: header };
  } catch {
    return { raw: header };
  }
}

export function ChargeDemo() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChargeResponse | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCharge = async () => {
    if (!walletClient?.account) return;

    setLoading(true);
    setResult(null);
    setReceipt(null);
    setError(null);

    try {
      const mppx = createChargeClient(
        walletClient as WalletClient<Transport, ChainEIP712, Account>,
      );
      const response = await mppx.fetch("/api/charge");

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Request failed (${response.status}): ${text.slice(0, 200)}`,
        );
      }

      const data = (await response.json()) as ChargeResponse;
      setResult(data);
      setReceipt(parseReceipt(response.headers.get("Payment-Receipt")));
    } catch (err) {
      setError(
        err instanceof Error ? err.message.split("\n")[0] : "Unknown error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="text-xs text-gray-500 text-center font-sans">
        One-time ERC-3009 payment. You sign typed data, the server broadcasts
        the transfer.
      </p>

      <button
        className="rounded-lg border border-accent/30 bg-accent/10 text-accent transition-colors flex items-center justify-center gap-2 hover:bg-accent/20 cursor-pointer text-sm px-5 h-10 font-sans disabled:opacity-40 disabled:cursor-not-allowed w-full"
        onClick={handleCharge}
        disabled={!address || !walletClient || loading}
        type="button"
      >
        {loading ? (
          <>
            <span className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${CHARGE_AMOUNT} USDC.e (Charge)`
        )}
      </button>

      {result && (
        <div className="bg-white/5 border border-accent/20 rounded-lg p-4 w-full animate-fade-in-up">
          <p className="text-xs text-accent font-mono mb-2">Charge settled</p>
          <div className="space-y-1.5 text-sm font-sans">
            <p className="text-white">{result.message}</p>
            <p className="text-gray-400 text-xs">{result.fact}</p>
            {receipt?.txHash && (
              <a
                href={`https://sepolia.abscan.org/tx/${receipt.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent/70 hover:text-accent text-xs font-mono transition-colors inline-block"
              >
                tx: {receipt.txHash.slice(0, 10)}...{receipt.txHash.slice(-8)}
              </a>
            )}
            <p className="text-gray-500 text-[10px] font-mono">
              {result.timestamp}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 w-full overflow-hidden">
          <p className="text-xs text-red-400 break-words">{error}</p>
        </div>
      )}
    </div>
  );
}
