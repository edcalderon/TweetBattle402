"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { BattleCard } from "@/components/battle-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoBattles } from "@/lib/demo-data";
import { fetchBattles, tweetBattleArenaContract } from "@/lib/onchain";

const BATTLE_FILTERS = [
  "All",
  "PendingAcceptance",
  "Active",
  "Voting",
  "Finalized",
  "Cancelled",
];

export function BattlesPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const publicClient = usePublicClient();
  const {
    data: onchainBattles,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["tweetbattle402", "battles"],
    queryFn: () => fetchBattles(publicClient),
    enabled: Boolean(tweetBattleArenaContract && publicClient),
    retry: false,
    refetchInterval: (query) => (query.state.data ? 20_000 : false),
  });
  const battles = useMemo(
    () =>
      (tweetBattleArenaContract && !isError ? onchainBattles ?? [] : demoBattles).filter(
        (battle) =>
          (filter === "All" || battle.status === filter) &&
          `${battle.topic} ${battle.challengerHandle} ${battle.opponentHandle}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [filter, query, onchainBattles, isError],
  );

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-16 md:px-8">
      <div className="flex flex-col justify-between gap-8 border-b-2 border-ink pb-10 lg:flex-row lg:items-end">
        <div>
          <Badge className="bg-mon text-white">Public arenas</Badge>
          <h1 className="display mt-4 text-7xl font-black leading-[0.84] md:text-9xl">
            Pick a side.
          </h1>
          <p className="mt-5 max-w-xl text-lg font-semibold text-black/55">
            Follow live arguments, fund your verdict with quadratic votes, and
            inspect every settlement.
          </p>
        </div>
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-3.5 h-4 w-4" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topic or handle"
            className="pl-10"
          />
        </div>
      </div>
      {tweetBattleArenaContract && isError && (
        <div className="mt-6 border-2 border-acid bg-white p-4 text-sm font-semibold">
          On-chain battles could not be loaded from the Monad RPC. Showing the
          demo battle list instead.
        </div>
      )}
      <div className="my-8 flex flex-wrap items-center gap-3">
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        {BATTLE_FILTERS.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={filter === item ? "dark" : "outline"}
            onClick={() => setFilter(item)}
          >
            {item === "PendingAcceptance" ? "Pending" : item}
          </Button>
        ))}
      </div>
      {tweetBattleArenaContract && isLoading && battles.length === 0 && (
        <div className="mb-6 border-2 border-dashed border-ink p-6 text-sm font-bold">
          Loading on-chain battles...
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {battles.map((battle) => (
          <BattleCard key={battle.id} battle={battle} />
        ))}
      </div>
      {battles.length === 0 && !isLoading && (
        <div className="border-2 border-dashed border-ink p-16 text-center font-black">
          {tweetBattleArenaContract
            ? "No on-chain battles match this filter."
            : "No battles match this filter."}
        </div>
      )}
    </main>
  );
}
