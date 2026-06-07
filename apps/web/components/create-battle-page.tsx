"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Info, Swords } from "lucide-react";
import { parseEther } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  parseBattleCreatedIdFromReceipt,
  tweetBattleArenaContract,
} from "@/lib/onchain";

const fieldLabel =
  "mb-2 block text-[11px] font-black uppercase tracking-[0.16em]";

export function CreateBattlePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const transactionModeLabel = tweetBattleArenaContract
    ? "On-chain transaction"
    : "Demo-aware transaction";
  const transactionModeCopy = tweetBattleArenaContract
    ? "A connected wallet will receive a real contract transaction."
    : "No contract address is configured, so this creates a local demo battle with the complete UI flow.";
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    challengerHandle: "",
    opponentHandle: "rollupmaxi",
    topic: "Does Monad make general-purpose L2s obsolete?",
    stake: "5",
    tweets: "3",
    duration: "3600",
    votingDuration: "3600",
    aiWeight: "30",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setNotice("");
    const challengerHandle = form.challengerHandle.replace(/^@/, "") || "you";
    const opponentHandle = form.opponentHandle.replace(/^@/, "");

    if (tweetBattleArenaContract && isConnected && publicClient) {
      try {
        const hash = await writeContractAsync({
          ...tweetBattleArenaContract,
          functionName: "createBattle",
          value: parseEther(form.stake),
          args: [
            opponentHandle,
            challengerHandle,
            form.topic,
            Number(form.tweets),
            BigInt(form.duration),
            BigInt(form.votingDuration),
            Number(form.aiWeight) * 100,
          ],
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        const battleId = parseBattleCreatedIdFromReceipt(receipt);
        if (!battleId) {
          throw new Error(
            "Could not read the created battle id from the transaction receipt.",
          );
        }
        router.push(`/battle/${battleId}`);
        return;
      } catch {
        setNotice(
          "Wallet transaction was not completed. No local fallback is used when the contract is configured.",
        );
        return;
      }
    }

    const battleId = Math.floor(500 + Math.random() * 400);
    const battle = {
      id: battleId,
      challenger: "Connected wallet",
      opponent: "",
      challengerHandle,
      opponentHandle,
      topic: form.topic,
      stakeAmount: form.stake,
      tweetsPerPlayer: Number(form.tweets),
      status: "PendingAcceptance",
      endTime: Date.now() + Number(form.duration) * 1000,
      votingEndTime: 0,
      aiWeightBps: Number(form.aiWeight) * 100,
      challengerVotePower: 0,
      opponentVotePower: 0,
      votePool: "0",
    };
    localStorage.setItem(`tb402:battle:${battleId}`, JSON.stringify(battle));
    router.push(`/battle/${battleId}`);
  }

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-14 md:px-8 md:py-20">
      <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_.6fr]">
        <div>
          <Badge className="bg-ember text-white">New challenge</Badge>
          <h1 className="display mt-5 text-6xl font-black leading-[0.85] md:text-8xl">
            Set the terms.
            <br />
            <span className="text-ember">Stake your words.</span>
          </h1>
        </div>
        <div className="self-end border-l-2 border-ink pl-5 text-sm font-semibold leading-relaxed text-black/60">
          Your stake is escrowed when the battle is created. The opponent must
          match it to activate the clock. X handles are self-declared in this
          MVP.
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-7 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <h2 className="display text-4xl font-black">
              Battle configuration
            </h2>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label htmlFor="challenger-handle">
                <span className={fieldLabel}>Your X handle</span>
                <Input
                  id="challenger-handle"
                  required
                  value={form.challengerHandle}
                  onChange={(event) =>
                    update("challengerHandle", event.target.value)
                  }
                  placeholder="@yourhandle"
                />
              </label>
              <label htmlFor="opponent-handle">
                <span className={fieldLabel}>Opponent X handle</span>
                <Input
                  id="opponent-handle"
                  required
                  value={form.opponentHandle}
                  onChange={(event) =>
                    update("opponentHandle", event.target.value)
                  }
                  placeholder="@opponent"
                />
              </label>
            </div>
            <label htmlFor="battle-topic">
              <span className={fieldLabel}>Debate topic</span>
              <Textarea
                id="battle-topic"
                required
                value={form.topic}
                onChange={(event) => update("topic", event.target.value)}
                maxLength={240}
              />
              <span className="mt-1 block text-right font-mono text-[10px]">
                {form.topic.length}/240
              </span>
            </label>
            <div className="grid gap-5 md:grid-cols-3">
              <label htmlFor="stake-amount">
                <span className={fieldLabel}>Stake per side</span>
                <div className="relative">
                  <Input
                    id="stake-amount"
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.stake}
                    onChange={(event) => update("stake", event.target.value)}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-3.5 text-xs font-black">
                    MON
                  </span>
                </div>
              </label>
              <label htmlFor="tweets-per-player">
                <span className={fieldLabel}>Tweets per player</span>
                <select
                  id="tweets-per-player"
                  className="h-12 w-full border-2 border-ink bg-white px-3 text-sm font-black"
                  value={form.tweets}
                  onChange={(event) => update("tweets", event.target.value)}
                >
                  <option value="1">1 tweet</option>
                  <option value="2">2 tweets</option>
                  <option value="3">3 tweets</option>
                </select>
              </label>
              <label htmlFor="argument-window">
                <span className={fieldLabel}>Argument window</span>
                <select
                  id="argument-window"
                  className="h-12 w-full border-2 border-ink bg-white px-3 text-sm font-black"
                  value={form.duration}
                  onChange={(event) => update("duration", event.target.value)}
                >
                  <option value="900">15 minutes</option>
                  <option value="3600">1 hour</option>
                  <option value="86400">24 hours</option>
                </select>
              </label>
            </div>
            <label htmlFor="ai-weight">
              <div className="flex justify-between">
                <span className={fieldLabel}>AI judge weight</span>
                <span className="font-mono text-sm font-black">
                  {form.aiWeight}% AI · {100 - Number(form.aiWeight)}% community
                </span>
              </div>
              <input
                id="ai-weight"
                type="range"
                min="10"
                max="50"
                step="5"
                value={form.aiWeight}
                onChange={(event) => update("aiWeight", event.target.value)}
                className="w-full"
              />
            </label>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-ink text-paper shadow-hard-acid">
            <CardContent>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-acid">
                Escrow preview
              </div>
              <div className="display mt-3 text-6xl font-black">
                {form.stake || "0"} <span className="text-2xl">MON</span>
              </div>
              <div className="mt-6 space-y-3 border-t border-paper/20 pt-5 text-sm">
                <Summary
                  label="Total prize stakes"
                  value={`${Number(form.stake || 0) * 2} MON`}
                />
                <Summary label="Platform fee" value="0%" />
                <Summary label="Vote pool" value="Added live" />
                <Summary label="Network" value="Monad Testnet" />
              </div>
            </CardContent>
          </Card>
          <div className="border-2 border-ink bg-white p-4 text-xs font-semibold leading-relaxed">
            <div className="mb-2 flex items-center gap-2 font-black uppercase tracking-wider">
              <Info className="h-4 w-4 text-mon" /> {transactionModeLabel}
            </div>
            {transactionModeCopy}
          </div>
          {notice && <p className="text-xs font-bold text-ember">{notice}</p>}
          <Button size="lg" className="w-full" disabled={isPending}>
            <Swords className="h-5 w-5" />
            {isPending ? "Confirm in wallet" : "Create & escrow battle"}
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex gap-2 text-[11px] font-bold text-black/55">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-700" />
            You will generate the public challenge tweet after creation.
          </div>
        </div>
      </form>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-paper/55">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}
