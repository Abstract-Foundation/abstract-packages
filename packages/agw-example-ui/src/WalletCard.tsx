import type { ReactNode } from "react";

type ConnectedWalletCardProps = {
  address: string;
  children?: ReactNode;
  explorerHref?: string;
  onDisconnect: () => void;
};

type SubmitTransactionButtonProps = {
  disabled?: boolean;
  isPending?: boolean;
  onClick: () => void | Promise<void>;
};

type TransactionStatusProps = {
  explorerHref?: string;
  isSuccess: boolean;
  transactionHash?: string;
};

export function ConnectedWalletCard({
  address,
  children,
  explorerHref,
  onDisconnect,
}: ConnectedWalletCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 shadow-lg backdrop-blur-sm w-full max-w-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-sm sm:text-base font-medium font-[family-name:var(--font-roobert)] mb-1">
            Connected to Abstract Global Wallet
          </p>
          <p className="text-xs text-gray-400 font-mono break-all">{address}</p>
          {explorerHref && (
            <p className="text-sm sm:text-base font-medium font-[family-name:var(--font-roobert)] mt-2">
              <a href={explorerHref} target="_blank" rel="noopener noreferrer">
                View on Explorer
              </a>
            </p>
          )}
        </div>

        <div className="flex flex-col w-full gap-2">
          <DisconnectButton onClick={onDisconnect} />
          {children}
        </div>
      </div>
    </div>
  );
}

export function SubmitTransactionButton({
  disabled = false,
  isPending = false,
  onClick,
}: SubmitTransactionButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-full border border-solid transition-colors flex items-center justify-center text-white gap-2 text-sm h-10 px-5 font-[family-name:var(--font-roobert)] w-full ${
        disabled || isPending
          ? "bg-gray-500 cursor-not-allowed opacity-50"
          : "bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 hover:cursor-pointer border-transparent"
      }`}
      onClick={onClick}
      disabled={disabled || isPending}
    >
      <LightningIcon />
      <span className="w-full text-center">Submit tx</span>
    </button>
  );
}

export function TransactionStatus({
  explorerHref,
  isSuccess,
  transactionHash,
}: TransactionStatusProps) {
  if (!transactionHash) return null;

  return (
    <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg text-center w-full">
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm sm:text-base font-medium font-[family-name:var(--font-roobert)]">
          {isSuccess ? "Transaction Success" : "Transaction Pending"}
        </p>

        {explorerHref && (
          <a
            href={explorerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            View on Explorer
          </a>
        )}
      </div>
    </div>
  );
}

function DisconnectButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-full border border-solid border-white/20 transition-colors flex items-center justify-center bg-white/10 text-white gap-2 hover:bg-white/20 hover:cursor-pointer text-sm px-5 font-[family-name:var(--font-roobert)] w-full h-10 py-2"
      onClick={onClick}
    >
      <DisconnectIcon />
      Disconnect
    </button>
  );
}

function DisconnectIcon() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}
