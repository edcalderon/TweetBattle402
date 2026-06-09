"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useConnect } from "wagmi";
import { Wallet, X, ExternalLink, Smartphone } from "lucide-react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);
  return isMobile;
}

function hasInjectedWallet() {
  if (typeof window === "undefined") return false;
  return Boolean((window as { ethereum?: unknown }).ethereum);
}

function isMetaMaskInjected() {
  if (typeof window === "undefined") return false;
  const eth = (window as { ethereum?: { isMetaMask?: boolean } }).ethereum;
  return Boolean(eth?.isMetaMask);
}

const CONNECTOR_META: Record<
  string,
  { label: string; icon: string; description: string }
> = {
  injected: {
    label: "Browser Wallet",
    icon: "🦊",
    description: "MetaMask, Brave, or any injected wallet",
  },
  walletConnect: {
    label: "WalletConnect",
    icon: "🔗",
    description: "Scan QR code with any mobile wallet",
  },
  coinbaseWallet: {
    label: "Coinbase Wallet",
    icon: "🔵",
    description: "Coinbase Wallet extension or app",
  },
};

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ open, onClose }: WalletConnectModalProps) {
  const { connect, connectors, isPending, error } = useConnect();
  const isMobile = useIsMobile();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!isPending) setConnectingId(null);
  }, [isPending]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href.replace(/^https?:\/\//, "")
      : "tweetbattle402.xyz";
  const metamaskDeepLink = `https://metamask.app.link/dapp/${currentUrl}`;

  function handleConnect(connectorId: string) {
    const connector = connectors.find((c) => c.id === connectorId);
    if (!connector) return;
    setConnectingId(connectorId);
    connect({ connector });
    setTimeout(onClose, 800);
  }

  const injectedLabel = isMetaMaskInjected() ? "MetaMask" : "Browser Wallet";
  const injectedIcon = isMetaMaskInjected() ? "🦊" : "💳";
  const showMobileDeepLink = isMobile && !hasInjectedWallet();

  return createPortal(
    /* Full-screen backdrop — rendered at document.body, outside any stacking context */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" />

      {/* Modal card — always centered, never overflows */}
      <div
        className="relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border-2 border-ink bg-paper"
        style={{ maxHeight: "calc(100vh - 40px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — fixed, never scrolls */}
        <div className="flex shrink-0 items-center justify-between border-b-2 border-ink p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center bg-ink text-acid">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-black uppercase tracking-[0.12em]">
                Connect wallet
              </div>
              <div className="text-[11px] text-ink/50">
                Choose how to connect
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Connector list — scrolls if needed */}
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {connectors.map((connector) => {
            const isInjected = connector.id === "injected";
            const meta =
              CONNECTOR_META[connector.id] ?? CONNECTOR_META["injected"];
            const label = isInjected ? injectedLabel : meta.label;
            const icon = isInjected ? injectedIcon : meta.icon;
            const unavailable = isInjected && !hasInjectedWallet();
            const isConnecting = connectingId === connector.id;

            return (
              <button
                key={connector.uid}
                onClick={() => !unavailable && handleConnect(connector.id)}
                disabled={unavailable || isPending}
                className="flex w-full items-center gap-4 border-2 border-ink p-4 text-left transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-2xl">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black">{label}</div>
                  <div className="text-[11px] text-current/60">
                    {unavailable
                      ? "Not detected — install or use app link below"
                      : meta.description}
                  </div>
                </div>
                {isConnecting && (
                  <span className="shrink-0 text-[11px] font-black uppercase text-mon">
                    Connecting…
                  </span>
                )}
              </button>
            );
          })}

          {showMobileDeepLink && (
            <a
              href={metamaskDeepLink}
              className="flex w-full items-center gap-4 border-2 border-acid bg-acid p-4 text-left transition-colors hover:bg-ink hover:text-acid"
            >
              <Smartphone className="h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black">Open in MetaMask App</div>
                <div className="text-[11px] opacity-70">
                  Opens MetaMask and loads this dapp
                </div>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0" />
            </a>
          )}
        </div>

        {error && (
          <div className="shrink-0 border-t-2 border-ink px-4 pb-3 pt-2 text-xs font-bold text-ember">
            {error.message.slice(0, 120)}
          </div>
        )}

        {/* Footer — fixed, never scrolls */}
        <div className="shrink-0 border-t-2 border-ink px-4 py-3 text-[10px] font-semibold text-ink/40">
          Connecting to Monad Testnet · No custodial access to your funds
        </div>
      </div>
    </div>,
    document.body,
  );
}
