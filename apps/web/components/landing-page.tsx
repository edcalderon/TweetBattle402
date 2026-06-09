"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Coins,
  MessageSquareText,
  Scale,
  ShieldCheck,
  Sparkles,
  Vote,
} from "lucide-react";
import { usePublicClient } from "wagmi";
import { demoBattles } from "@/lib/demo-data";
import { BattleCard } from "@/components/battle-card";
import { Button } from "@/components/ui/button";
import { fetchBattles, tweetBattleArenaContract } from "@/lib/onchain";

const steps = [
  {
    n: "01",
    icon: Coins,
    title: "Escrow MON",
    body: "Set the topic, terms, and stake. Your challenge is recorded on Monad.",
  },
  {
    n: "02",
    icon: MessageSquareText,
    title: "Post your case",
    body: "Publish manually on X, then submit each public tweet URL to the battle.",
  },
  {
    n: "03",
    icon: Vote,
    title: "Earn the verdict",
    body: "Quadratic community voting and an AI judge combine into the final score.",
  },
] as const;

export function LandingPage() {
  const publicClient = usePublicClient();
  const {
    data: onchainBattles,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["tweetbattle402", "landing-battles"],
    queryFn: () => fetchBattles(publicClient),
    enabled: Boolean(tweetBattleArenaContract && publicClient),
    retry: false,
    refetchInterval: (query) => (query.state.data ? 20_000 : false),
  });
  const sourceBattles = tweetBattleArenaContract
    ? isError
      ? demoBattles
      : onchainBattles ?? []
    : demoBattles;

  return (
    <main>
      <section className="noise relative overflow-hidden border-b-2 border-ink bg-ink text-paper">
        <div className="absolute -right-20 top-20 h-72 w-72 rotate-12 border-[40px] border-mon/35" />
        <div className="absolute bottom-8 right-[28%] h-16 w-16 rounded-full bg-ember" />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-16 md:px-8 md:py-20 lg:min-h-[690px] lg:grid-cols-[1.3fr_.7fr]">
          <div className="animate-rise">
            <div className="mb-7 flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-acid">
              <span className="h-2 w-2 animate-pulse rounded-full bg-acid" />
              Live on Monad Testnet
            </div>
            <h1 className="display max-w-5xl text-[clamp(4.5rem,10vw,9rem)] font-black leading-[0.76]">
              SETTLE IT
              <span className="block text-acid">ONCHAIN.</span>
            </h1>
            <p className="mt-9 max-w-2xl text-xl font-semibold leading-relaxed text-paper/70 md:text-2xl">
              Challenge anyone on X. Escrow MON. Debate with a fixed number of
              tweets. Let the community and AI decide the winner.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/create">
                  Create battle <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/battles">Explore battles</Link>
              </Button>
              <a
                href="#how"
                className="flex items-center gap-2 px-3 text-xs font-black uppercase tracking-[0.16em] text-paper/70 hover:text-acid"
              >
                How it works <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md animate-rise [animation-delay:180ms]">
            <div className="absolute -left-8 -top-8 h-full w-full border-2 border-acid/30" />
            <div className="relative rotate-2 border-2 border-paper bg-paper p-6 text-ink shadow-[12px_12px_0_#d9ff52]">
              <div className="flex items-center justify-between border-b-2 border-ink pb-4">
                <span className="font-mono text-xs font-black">#TB402-402</span>
                <span className="bg-ember px-2 py-1 text-[10px] font-black uppercase text-white">
                  Arguments live
                </span>
              </div>
              <div className="py-8 text-center">
                <div className="text-sm font-black">@chainpoet</div>
                <div className="display my-2 text-6xl font-black italic">
                  VS
                </div>
                <div className="text-sm font-black">@rollupmaxi</div>
              </div>
              <div className="grid grid-cols-2 border-t-2 border-ink">
                <div className="border-r-2 border-ink p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest">
                    Escrow
                  </div>
                  <div className="mt-1 text-2xl font-black">24 MON</div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest">
                    Community
                  </div>
                  <div className="mt-1 text-2xl font-black">61 votes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden border-t-2 border-acid bg-acid py-3 text-ink">
          <div className="flex w-max animate-ticker-left gap-10 text-xs font-black uppercase tracking-[0.18em]">
            {Array.from({ length: 2 }).map((_, group) => (
              <div key={group} className="flex gap-10">
                <span>Stake your words</span>
                <span>◆</span>
                <span>No X API required</span>
                <span>◆</span>
                <span>Quadratic community verdict</span>
                <span>◆</span>
                <span>AI argument scoring</span>
                <span>◆</span>
                <span>Settled on Monad</span>
                <span>◆</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1440px] px-4 py-24 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[.55fr_1fr]">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-ember">
              No more empty arguments
            </div>
            <h2 className="display mt-4 text-6xl font-black leading-[0.86] md:text-8xl">
              Put skin in the game.
            </h2>
          </div>
          <div className="grid border-2 border-ink sm:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.n}
                className={`relative min-h-60 p-6 ${index < 2 ? "border-b-2 border-ink sm:border-b-0 sm:border-r-2" : ""}`}
              >
                <span className="font-mono text-xs font-black">{step.n}</span>
                <step.icon className="mt-10 h-9 w-9" strokeWidth={1.7} />
                <h3 className="display mt-5 text-3xl font-black">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-black/55">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y-2 border-ink bg-mon px-4 py-20 text-white md:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-2">
          <div>
            <BadgeLine icon={ShieldCheck} text="Intentional X integration" />
            <h2 className="display mt-5 text-6xl font-black leading-[0.9] md:text-8xl">
              X for reach.
              <br />
              Monad for truth.
            </h2>
          </div>
          <div className="grid content-center gap-4">
            {[
              [
                "Public distribution",
                "Prefilled X intent links, never auto-posted.",
              ],
              [
                "Credible settlement",
                "Escrow, votes, state, and rewards on Monad.",
              ],
              [
                "Structured assistance",
                "Premium AI tools with mandatory user approval.",
              ],
            ].map(([title, body]) => (
              <div
                key={title}
                className="flex gap-4 border-t border-white/35 pt-4"
              >
                <Sparkles className="mt-1 h-5 w-5 shrink-0 text-acid" />
                <div>
                  <div className="font-black uppercase tracking-wide">
                    {title}
                  </div>
                  <div className="mt-1 text-sm text-white/65">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-24 md:px-8">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-ember">
              Open arenas
            </div>
            <h2 className="display mt-3 text-6xl font-black">
              Watch the stakes.
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/battles">
              View all battles <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sourceBattles.map((battle) => (
            <BattleCard key={battle.id} battle={battle} />
          ))}
        </div>
        {tweetBattleArenaContract && isLoading && sourceBattles.length === 0 && (
          <div className="mt-6 border-2 border-dashed border-ink p-6 text-sm font-bold">
            Loading on-chain battles...
          </div>
        )}
        {tweetBattleArenaContract && isError && (
          <div className="mt-6 border-2 border-acid bg-white p-4 text-sm font-semibold">
            On-chain battles could not be loaded from the Monad RPC. Showing
            the demo battles instead.
          </div>
        )}
        {tweetBattleArenaContract &&
          !isLoading &&
          !isError &&
          sourceBattles.length === 0 && (
            <div className="mt-6 border-2 border-dashed border-ink p-6 text-sm font-bold">
              No on-chain battles found yet.
            </div>
          )}
      </section>

      <section className="border-t-2 border-ink bg-acid px-4 py-16 md:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em]">
              <Bot className="h-4 w-4" /> Community + AI verdict
            </div>
            <h2 className="display mt-3 text-5xl font-black md:text-7xl">
              Your argument has a price now.
            </h2>
          </div>
          <Button asChild variant="dark" size="lg">
            <Link href="/create">
              Enter the arena <Scale className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function BadgeLine({
  icon: Icon,
  text,
}: {
  icon: typeof ShieldCheck;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-acid">
      <Icon className="h-4 w-4" /> {text}
    </div>
  );
}
