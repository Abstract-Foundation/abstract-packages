"use client";

import {
  ConnectedWalletCard,
  SignInWithAbstractButton,
} from "@abstract-foundation/agw-example-ui";
import { createWallet, type Wallet } from "@abstract-foundation/wallet-sdk";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_HOST = "https://wallet.abs.xyz";
const ABSTRACT_CHAIN_ID = 2741;
const NEXT_ENV_VALUES = [
  process.env.NODE_ENV,
  process.env.NEXT_PUBLIC_NEXT_ENV,
  process.env.NEXT_PUBLIC_VERCEL_ENV,
  process.env.NEXT_PUBLIC_APP_ENV,
].map((value) => value?.toLowerCase());
const SKIP_PROTOCOL_CHECK = NEXT_ENV_VALUES.some(
  (value) => value === "development" || value === "local",
);

type LogEntry = {
  ts: number;
  kind: "info" | "ok" | "err";
  label: string;
  detail?: string;
};

/**
 * Minimal end-to-end demo of @abstract-foundation/wallet-sdk.
 *
 * 1. Mount the SDK pointing at the wallet-host (defaults to
 *    http://localhost:3003 — override via `NEXT_PUBLIC_WALLET_HOST_URL`).
 * 2. Click "Connect" → SDK opens the iframe → user authenticates inside →
 *    SDK returns the AGW smart-account address.
 * 3. Click "Sign Message" → SDK opens the iframe with a signature review
 *    surface → user approves → SDK returns the EIP-191 signature.
 * 4. Click "Send Transaction" → SDK opens the iframe with a transaction
 *    review surface → user approves → SDK returns the tx hash (AGW
 *    sponsors gas via paymaster).
 *
 * Every action's request + result is appended to the log panel so the
 * iframe round-trip is visible.
 */
export function Demo() {
  const host = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_WALLET_HOST_URL?.trim() || DEFAULT_HOST
    ).replace(/\/$/, "");
  }, []);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    const created = createWallet({
      host,
      chainId: ABSTRACT_CHAIN_ID,
      skipProtocolCheck: SKIP_PROTOCOL_CHECK,
    });
    setWallet(created);
    return () => {
      created.destroy();
    };
  }, [host]);

  const append = (entry: Omit<LogEntry, "ts">) =>
    setLog((prev) => [...prev, { ts: Date.now(), ...entry }]);

  async function runConnect() {
    if (!wallet) return;
    setBusy(true);
    append({ kind: "info", label: "wallet_connect → wallet-host iframe" });
    try {
      const result = (await wallet.provider.request({
        method: "wallet_connect",
        params: [{ chainId: ABSTRACT_CHAIN_ID }],
      })) as { accounts?: { address: string }[] };
      const address = result?.accounts?.[0]?.address ?? null;
      setAccount(address);
      append({
        kind: "ok",
        label: "wallet_connect → ok",
        detail: address ?? JSON.stringify(result),
      });
    } catch (error) {
      append({
        kind: "err",
        label: "wallet_connect → error",
        detail: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy(false);
    }
  }

  async function runSignMessage() {
    if (!wallet || !account) return;
    setBusy(true);
    const message = `Hello from wallet-sdk demo @ ${new Date().toISOString()}`;
    append({ kind: "info", label: `personal_sign → "${message}"` });
    try {
      const signature = (await wallet.provider.request({
        method: "personal_sign",
        params: [toHex(message), account],
      })) as string;
      append({ kind: "ok", label: "personal_sign → ok", detail: signature });
    } catch (error) {
      append({
        kind: "err",
        label: "personal_sign → error",
        detail: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy(false);
    }
  }

  async function runSendTransaction() {
    if (!wallet || !account) return;
    setBusy(true);
    // Self-send 0 ETH — cheapest valid tx that still exercises the AGW
    // smart-account path.
    const tx = {
      from: account,
      to: account,
      value: "0x0" as const,
    };
    append({
      kind: "info",
      label: "eth_sendTransaction → self-send 0 ETH",
      detail: JSON.stringify(tx),
    });
    try {
      const hash = (await wallet.provider.request({
        method: "eth_sendTransaction",
        params: [tx],
      })) as string;
      append({
        kind: "ok",
        label: "eth_sendTransaction → ok",
        detail: hash,
      });
    } catch (error) {
      append({
        kind: "err",
        label: "eth_sendTransaction → error",
        detail: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy(false);
    }
  }

  async function runDisconnect() {
    if (!wallet) return;
    setBusy(true);
    try {
      await wallet.disconnect();
      setAccount(null);
      append({ kind: "ok", label: "disconnected" });
    } catch (error) {
      append({
        kind: "err",
        label: "disconnect → error",
        detail: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 font-[family-name:var(--font-roobert)] text-white">
      {account ? (
        <ConnectedWalletCard address={account} onDisconnect={runDisconnect}>
          <DemoActionButton
            disabled={busy}
            label="Sign message"
            onClick={runSignMessage}
          />
          <DemoActionButton
            disabled={busy}
            label="Send transaction"
            onClick={runSendTransaction}
            variant="primary"
          />
        </ConnectedWalletCard>
      ) : (
        <div className="flex justify-center">
          <SignInWithAbstractButton isLoading={busy} onClick={runConnect} />
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-left shadow-lg backdrop-blur-sm">
        <div className="mb-3 flex flex-col gap-1">
          <p className="text-sm font-medium">Wallet SDK host</p>
          <code className="break-all rounded bg-white/[.06] px-2 py-1 font-[family-name:var(--font-geist-mono)] text-xs text-gray-300">
            {host}
          </code>
        </div>

        {log.length === 0 ? (
          <p className="text-sm text-gray-400">
            Connect to run wallet_connect, personal_sign, and a sponsored
            self-send transaction.
          </p>
        ) : (
          <ol className="flex max-h-64 flex-col gap-3 overflow-y-auto border-t border-white/10 pt-3">
            {log.map((entry) => (
              <li key={entry.ts} className="grid gap-1 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white">{entry.label}</span>
                  <span
                    className={`shrink-0 text-xs font-semibold uppercase ${
                      entry.kind === "ok"
                        ? "text-green-400"
                        : entry.kind === "err"
                          ? "text-red-400"
                          : "text-gray-400"
                    }`}
                  >
                    {entry.kind}
                  </span>
                </div>
                <time className="font-[family-name:var(--font-geist-mono)] text-xs text-gray-500">
                  {new Date(entry.ts).toLocaleTimeString()}
                </time>
                {entry.detail && (
                  <code className="break-all rounded bg-black/30 px-2 py-1 font-[family-name:var(--font-geist-mono)] text-xs text-gray-300">
                    {entry.detail}
                  </code>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function toHex(value: string): `0x${string}` {
  let hex = "";
  for (let i = 0; i < value.length; i += 1) {
    hex += value.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return `0x${hex}`;
}

function DemoActionButton({
  disabled,
  label,
  onClick,
  variant = "secondary",
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      className={`flex h-10 w-full items-center justify-center rounded-full border border-solid px-5 text-sm transition-colors ${
        disabled
          ? "cursor-not-allowed border-transparent bg-gray-500 text-white opacity-50"
          : variant === "primary"
            ? "border-transparent bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 hover:cursor-pointer"
            : "border-white/20 bg-white/10 text-white hover:bg-white/20 hover:cursor-pointer"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
