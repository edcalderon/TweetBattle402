"use client";

import { Check, Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    const label = `Disconnect wallet${address ? ` ${address.slice(0, 5)}...${address.slice(-4)}` : ""}`;
    return (
      <Button
        variant="dark"
        size="sm"
        onClick={() => disconnect()}
        aria-label={label}
        title={label}
      >
        <Check className="h-3.5 w-3.5 text-acid" />
        <span className="hidden sm:inline">
          {address?.slice(0, 5)}...{address?.slice(-4)}
        </span>
      </Button>
    );
  }

  const label = isPending ? "Connecting wallet" : "Connect wallet";

  return (
    <Button
      size="sm"
      onClick={() => connectors[0] && connect({ connector: connectors[0] })}
      disabled={isPending || !connectors[0]}
      aria-label={label}
      title={label}
    >
      <Wallet className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">
        {isPending ? "Connecting" : "Connect wallet"}
      </span>
    </Button>
  );
}
