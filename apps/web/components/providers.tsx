"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MONAD_TESTNET_CHAIN } from "@tweetbattle402/shared";
import { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";

const config = createConfig({
  chains: [MONAD_TESTNET_CHAIN],
  connectors: [injected()],
  transports: {
    [MONAD_TESTNET_CHAIN.id]: http(),
  },
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
