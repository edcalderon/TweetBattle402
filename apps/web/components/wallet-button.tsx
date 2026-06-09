"use client";

import { useState } from "react";
import { Check, Wallet, ChevronDown, LogOut } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { WalletConnectModal } from "@/components/wallet-connect-modal";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (isConnected && address) {
    const short = `${address.slice(0, 5)}…${address.slice(-4)}`;
    return (
      <div className="relative">
        <Button
          variant="dark"
          size="sm"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={`Wallet ${short}`}
          title={`Connected: ${address}`}
        >
          <Check className="h-3.5 w-3.5 text-acid" />
          <span className="hidden sm:inline">{short}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full z-40 mt-1 min-w-[180px] border-2 border-ink bg-paper shadow-hard">
              <div className="border-b border-ink/20 px-3 py-2 font-mono text-[11px] text-ink/50">
                {address.slice(0, 10)}…{address.slice(-8)}
              </div>
              <button
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-black hover:bg-ink hover:text-paper"
                onClick={() => {
                  disconnect();
                  setMenuOpen(false);
                }}
              >
                <LogOut className="h-3.5 w-3.5" /> Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setModalOpen(true)}
        aria-label="Connect wallet"
      >
        <Wallet className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Connect wallet</span>
      </Button>

      <WalletConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
