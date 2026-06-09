"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowUpRight,
  Bot,
  Check,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  Gavel,
  Info,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  Trophy,
  Vote,
  WandSparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import {
  isAddressEqual,
  parseEther,
  zeroAddress,
  type Address,
} from "viem";
import {
  BATTLE_STATUS_LABELS,
  buildBattleCode,
  buildChallengeTweet,
  buildBattleUrl,
  computeQuadraticVoteCost,
  generateXIntentUrl,
  validateTweetUrl,
  voteCostWei,
  type Battle,
  type BattleSide,
  type BattleStatusName,
  type TweetType,
} from "@tweetbattle402/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { demoBattles, demoTweets } from "@/lib/demo-data";
import {
  readStoredBattle,
  selectBattleSeed,
} from "@/lib/battle-storage";
import {
  fetchBattleRoomData,
  tweetBattleArenaContract,
  type BattleDetails,
  type BattleSubmission,
} from "@/lib/onchain";

type JudgeResult = {
  challengerScore: number;
  opponentScore: number;
  reasoning: string;
};

function buildDemoBattleDetails(
  battle: Battle,
  status: BattleStatusName = battle.status,
): BattleDetails {
  const demoAddress = (seed: number) =>
    `0x${seed.toString(16).padStart(40, "0")}` as Address;
  const challengerWallet = demoAddress(battle.id + 1);
  const opponentWallet = demoAddress(battle.id + 2);
  const winner =
    status === "Finalized"
      ? battle.id === 399
        ? opponentWallet
        : challengerWallet
      : zeroAddress;

  return {
    ...battle,
    status,
    challenger: battle.challenger,
    opponent: battle.opponent,
    challengerWallet,
    opponentWallet,
    winner,
    rewardClaimed: false,
    createdAt: Date.now() - 1000 * 60 * 15,
    startTime: battle.status === "PendingAcceptance" ? 0 : Date.now() - 1000 * 60 * 30,
    duration: Math.max(0, battle.endTime - Date.now()),
    votingDuration:
      battle.votingEndTime > battle.endTime
        ? battle.votingEndTime - battle.endTime
        : 60 * 60 * 1000,
    communityWeightBps: 10_000 - battle.aiWeightBps,
  };
}

function buildDemoSubmissions(battleId: number): BattleSubmission[] {
  if (battleId !== 402) return [];

  return demoTweets.map((tweet, index) => ({
    side: tweet.side,
    type: tweet.type,
    handle: tweet.handle,
    text: tweet.text,
    url: tweet.url,
    author: zeroAddress,
    submissionNumber: index + 1,
  }));
}

function formatRemainingTime(targetTime: number) {
  const remainingSeconds = Math.max(
    0,
    Math.floor((targetTime - Date.now()) / 1000),
  );
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function BattleRoomPage() {
  const params = useParams<{ id: string }>();
  const parsedId = Number(params.id ?? 402);
  const id = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : 402;
  const initialSeedBattle = selectBattleSeed(id, null, demoBattles);
  const [storedBattle, setStoredBattle] = useState<Battle | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [demoStatus, setDemoStatus] = useState<BattleStatusName>(
    () => initialSeedBattle?.status ?? "PendingAcceptance",
  );
  const [demoSubmissions, setDemoSubmissions] = useState<BattleSubmission[]>(
    () => (initialSeedBattle ? buildDemoSubmissions(initialSeedBattle.id) : []),
  );
  const [tweetType, setTweetType] = useState<TweetType>("Counterargument");
  const [draft, setDraft] = useState("");
  const [tweetUrl, setTweetUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [votePower, setVotePower] = useState(3);
  const [voteSide, setVoteSide] = useState<BattleSide>("challenger");
  const [demoVoteRecorded, setDemoVoteRecorded] = useState(false);
  const [aiResult, setAiResult] = useState<JudgeResult | null>(
    () =>
      initialSeedBattle?.status === "Finalized"
        ? {
            challengerScore: 7180,
            opponentScore: 8430,
            reasoning:
              "The opponent made the more coherent causal case and answered the strongest counterargument directly.",
          }
        : null,
  );
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState("");

  const publicClient = usePublicClient();
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { data: roomData, isLoading, isError, refetch } = useQuery({
    queryKey: ["tweetbattle402", "battle", id, address],
    queryFn: () => fetchBattleRoomData(publicClient, id, address),
    enabled: Boolean(tweetBattleArenaContract && publicClient && id > 0),
    retry: false,
    refetchInterval: (query) => (query.state.data ? 20_000 : false),
  });
  useEffect(() => {
    setStorageLoaded(false);
    setStoredBattle(readStoredBattle(id));
    setStorageLoaded(true);
  }, [id]);

  const seedBattle = selectBattleSeed(id, storedBattle, demoBattles);
  const liveBattle = roomData?.battle ?? null;
  const battle = liveBattle
    ? (liveBattle as BattleDetails)
    : seedBattle
      ? buildDemoBattleDetails(seedBattle, demoStatus)
      : null;
  const isLiveMode = Boolean(liveBattle);
  const battleOpponentHandle =
    liveBattle?.opponentHandle ?? seedBattle?.opponentHandle ?? "";

  useEffect(() => {
    if (!seedBattle) return;
    setDemoStatus(seedBattle.status);
    setDemoSubmissions(buildDemoSubmissions(seedBattle.id));
    setDemoVoteRecorded(false);
    setAiResult(
      seedBattle.status === "Finalized"
        ? {
            challengerScore: 7180,
            opponentScore: 8430,
            reasoning:
              "The opponent made the more coherent causal case and answered the strongest counterargument directly.",
          }
        : null,
    );
  }, [seedBattle?.id]);

  if (tweetBattleArenaContract && isLoading && !battle && !storageLoaded) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-[1440px] items-center justify-center px-4 py-16 md:px-8">
        <div className="border-2 border-ink bg-white p-8 text-sm font-bold shadow-hard">
          Loading on-chain battle data...
        </div>
      </main>
    );
  }

  if (tweetBattleArenaContract && isError && !battle && storageLoaded) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-[1440px] items-center justify-center px-4 py-16 md:px-8">
        <div className="max-w-xl border-2 border-ember bg-white p-8 text-sm font-bold shadow-hard">
          On-chain battle data could not be loaded from Monad RPC.
        </div>
      </main>
    );
  }

  if (tweetBattleArenaContract && !liveBattle && !battle && !isLoading && storageLoaded) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-[1440px] items-center justify-center px-4 py-16 md:px-8">
        <div className="max-w-xl border-2 border-ink bg-white p-8 text-sm font-bold shadow-hard">
          Battle #{id} was not found on-chain yet.
        </div>
      </main>
    );
  }

  if (!battle) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-[1440px] items-center justify-center px-4 py-16 md:px-8">
        <div className="border-2 border-dashed border-ink bg-white p-8 text-sm font-bold shadow-hard">
          Battle data is still loading.
        </div>
      </main>
    );
  }

  const activeBattle = battle as BattleDetails;
  const submissions = isLiveMode ? roomData?.submissions ?? [] : demoSubmissions;
  const status = activeBattle.status;
  const hasOnchainData = isLiveMode;
  const viewerHasVoted = roomData?.viewerHasVoted ?? demoVoteRecorded;
  const viewerTweetCount = roomData?.viewerTweetCount ?? 0;
  const owner = roomData?.owner ?? null;
  const resolver = roomData?.resolver ?? null;
  const isAdmin =
    Boolean(address && owner && isAddressEqual(address, owner)) ||
    Boolean(address && resolver && isAddressEqual(address, resolver));
  const canFinalize = status === "Voting" && Boolean(aiResult) && (hasOnchainData ? isAdmin : true);
  const canClaimReward =
    status === "Finalized" &&
    !activeBattle.rewardClaimed &&
    (hasOnchainData
      ? Boolean(address) && isAddressEqual(activeBattle.winner, address ?? zeroAddress)
      : true);

  const challengerVotes = hasOnchainData
    ? activeBattle.challengerVotePower
    : activeBattle.challengerVotePower +
      (demoVoteRecorded && voteSide === "challenger" ? votePower : 0);
  const opponentVotes = hasOnchainData
    ? activeBattle.opponentVotePower
    : activeBattle.opponentVotePower +
      (demoVoteRecorded && voteSide === "opponent" ? votePower : 0);
  const totalVotes = challengerVotes + opponentVotes;
  const challengerPercent =
    totalVotes === 0 ? 50 : Math.round((challengerVotes / totalVotes) * 100);
  const code = buildBattleCode(id);
  const battleUrl =
    typeof window === "undefined" ? buildBattleUrl(id) : window.location.href;
  const canMoveToVoting = status === "Active" && activeBattle.endTime <= Date.now();
  const challengeText = buildChallengeTweet({
    opponentHandle: activeBattle.opponentHandle,
    topic: activeBattle.topic,
    stake: activeBattle.stakeAmount,
    tweets: activeBattle.tweetsPerPlayer,
    battleId: id,
    battleUrl,
  });
  const generatedTweet = `${tweetType}: ${draft || `On "${activeBattle.topic}", the key question is which claim survives contact with evidence and incentives.`}\n\n#${code} #TweetBattle402 #Monad`;
  const countdownLabel =
    status === "Finalized"
      ? "Settlement final"
      : status === "PendingAcceptance"
        ? "Awaiting acceptance"
        : formatRemainingTime(
            status === "Voting"
              ? activeBattle.votingEndTime || activeBattle.endTime
              : activeBattle.endTime,
          );

  async function assist(tool: string) {
    setWorking(tool);
    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, topic: activeBattle.topic, position: draft }),
      });
      if (!response.ok) {
        throw new Error("AI assist request failed.");
      }
      const data = (await response.json()) as { text: string };
      setDraft(data.text);
    } catch {
      setNotice("AI assist is temporarily unavailable.");
    } finally {
      setWorking("");
    }
  }

  async function acceptBattle(handle: string) {
    const normalizedHandle = handle.replace(/^@/, "");
    if (!normalizedHandle) {
      setNotice("Enter the opponent handle before accepting.");
      return;
    }

    if (hasOnchainData && tweetBattleArenaContract && publicClient) {
      setWorking("acceptBattle");
      try {
        const hash = await writeContractAsync({
          ...tweetBattleArenaContract,
          functionName: "acceptBattle",
          args: [BigInt(id), normalizedHandle],
          value: parseEther(activeBattle.stakeAmount),
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setNotice("Battle accepted on-chain.");
        await refetch();
      } catch {
        setNotice("Acceptance transaction failed.");
      } finally {
        setWorking("");
      }
      return;
    }

    setDemoStatus("Active");
    setNotice("Demo battle accepted locally.");
  }

  async function submitTweet() {
    if (!validateTweetUrl(tweetUrl)) {
      setUrlError("Use a public x.com or twitter.com status URL.");
      return;
    }

    if (hasOnchainData && tweetBattleArenaContract && publicClient) {
      setWorking("submitTweet");
      setUrlError("");

      // Validate battle state before submitting
      if (status !== "Active") {
        setUrlError(`Battle is ${status.toLowerCase()}, tweets can only be submitted during Active phase.`);
        setWorking("");
        return;
      }

      if (Date.now() > activeBattle.endTime) {
        setUrlError("The submission deadline has passed.");
        setWorking("");
        return;
      }

      if (!address) {
        setUrlError("Connect your wallet to submit.");
        setWorking("");
        return;
      }

      if (
        !isAddressEqual(address, activeBattle.challengerWallet ?? zeroAddress) &&
        !isAddressEqual(address, activeBattle.opponentWallet ?? zeroAddress)
      ) {
        setUrlError("You are not a player in this battle.");
        setWorking("");
        return;
      }

      if (viewerTweetCount >= activeBattle.tweetsPerPlayer) {
        setUrlError(`You have reached the submission limit (${activeBattle.tweetsPerPlayer} tweets).`);
        setWorking("");
        return;
      }

      try {
        const hash = await writeContractAsync({
          ...tweetBattleArenaContract,
          functionName: "submitTweet",
          args: [BigInt(id), tweetUrl],
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setNotice("Tweet reference submitted on-chain.");
        setTweetUrl("");
        setUrlError("");
        await refetch();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Tweet submission failed";
        if (errorMsg.includes("user rejected")) {
          setUrlError("Transaction was cancelled.");
        } else if (errorMsg.includes("BattleNotActive")) {
          setUrlError(`Battle is ${status.toLowerCase()}. Tweets can only be submitted during the Active phase.`);
        } else if (errorMsg.includes("DeadlinePassed")) {
          setUrlError("The submission deadline has passed. The battle can now move to voting.");
        } else if (errorMsg.includes("NotPlayer")) {
          setUrlError("You are not a player in this battle.");
        } else if (errorMsg.includes("SubmissionLimitReached")) {
          setUrlError(`You have reached the submission limit (${activeBattle.tweetsPerPlayer} tweets).`);
        } else if (errorMsg.includes("InvalidValue")) {
          setUrlError("Tweet URL cannot be empty.");
        } else {
          setUrlError(`Submission failed: ${errorMsg.slice(0, 100)}`);
        }
      } finally {
        setWorking("");
      }
      return;
    }

    setDemoSubmissions((items) => [
      ...items,
      {
        side: "challenger",
        type: tweetType,
        handle: activeBattle.challengerHandle,
        text: draft || generatedTweet,
        url: tweetUrl,
        author: zeroAddress,
        submissionNumber: items.length + 1,
      },
    ]);
    setTweetUrl("");
    setUrlError("");
    setNotice("Demo submission stored locally.");
  }

  async function voteBattle() {
    if (hasOnchainData && tweetBattleArenaContract && publicClient) {
      if (!isConnected) {
        setNotice("Connect a wallet to vote on-chain.");
        return;
      }
      setWorking("vote");
      try {
        const hash = await writeContractAsync({
          ...tweetBattleArenaContract,
          functionName: "vote",
          args: [BigInt(id), voteSide === "challenger", votePower],
          value: voteCostWei(votePower),
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setNotice("Vote recorded on-chain.");
        await refetch();
      } catch {
        setNotice("Vote transaction failed.");
      } finally {
        setWorking("");
      }
      return;
    }

    setDemoVoteRecorded(true);
    setNotice("Demo vote recorded locally.");
  }

  async function moveToVoting() {
    if (hasOnchainData && tweetBattleArenaContract && publicClient) {
      setWorking("moveToVoting");
      try {
        const hash = await writeContractAsync({
          ...tweetBattleArenaContract,
          functionName: "moveToVoting",
          args: [BigInt(id)],
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setNotice("Battle moved to voting on-chain.");
        await refetch();
      } catch {
        setNotice("Could not move battle to voting yet.");
      } finally {
        setWorking("");
      }
      return;
    }

    setDemoStatus("Voting");
    setNotice("Demo battle moved to voting locally.");
  }

  async function runJudge() {
    setWorking("judge");
    try {
      const argumentsBySide = submissions.reduce(
        (result, item) => {
          result[item.side].push(item.text);
          return result;
        },
        { challenger: [] as string[], opponent: [] as string[] },
      );
      const response = await fetch("/api/ai/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeBattle.topic,
          challengerHandle: activeBattle.challengerHandle,
          opponentHandle: activeBattle.opponentHandle,
          challengerArguments: argumentsBySide.challenger,
          opponentArguments: argumentsBySide.opponent,
        }),
      });
      if (!response.ok) {
        throw new Error("AI judge request failed.");
      }
      setAiResult(await response.json());
      if (!hasOnchainData) {
        setDemoStatus("Voting");
      }
      setNotice(
        hasOnchainData
          ? "Judge preview generated. A resolver wallet can finalize the battle on-chain."
          : "Judge preview generated for the demo battle.",
      );
    } catch {
      setNotice("AI judge is temporarily unavailable.");
    } finally {
      setWorking("");
    }
  }

  async function finalizeBattle() {
    if (!aiResult) {
      setNotice("Generate a judge preview before finalizing.");
      return;
    }

    if (hasOnchainData && tweetBattleArenaContract && publicClient) {
      if (!isAdmin) {
        setNotice("Only the owner or resolver wallet can finalize on-chain.");
        return;
      }

      setWorking("finalizeBattle");
      try {
        const hash = await writeContractAsync({
          ...tweetBattleArenaContract,
          functionName: "finalizeBattle",
          args: [
            BigInt(id),
            Math.max(0, Math.min(10_000, Math.round(aiResult.challengerScore))),
            Math.max(0, Math.min(10_000, Math.round(aiResult.opponentScore))),
          ],
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setNotice("Battle finalized on-chain.");
        await refetch();
      } catch {
        setNotice("Finalization transaction failed.");
      } finally {
        setWorking("");
      }
      return;
    }

    setDemoStatus("Finalized");
    setNotice("Demo battle finalized locally.");
  }

  async function claimReward() {
    if (hasOnchainData && tweetBattleArenaContract && publicClient) {
      setWorking("claimReward");
      try {
        const hash = await writeContractAsync({
          ...tweetBattleArenaContract,
          functionName: "claimReward",
          args: [BigInt(id)],
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setNotice("Reward claimed on-chain.");
        await refetch();
      } catch {
        setNotice("Reward claim failed.");
      } finally {
        setWorking("");
      }
      return;
    }

    setNotice("Reward claims are only available on-chain.");
  }

  const battlePool = (Number(activeBattle.stakeAmount) * 2 + Number(activeBattle.votePool)).toFixed(2);
  const activeWinner =
    status === "Finalized"
      ? isAddressEqual(activeBattle.winner, activeBattle.challengerWallet)
        ? "challenger"
        : "opponent"
      : null;
  const demoSubmissionLimitReached =
    !hasOnchainData && demoSubmissions.length >= activeBattle.tweetsPerPlayer * 2;
  const rpcFallbackMessage =
    tweetBattleArenaContract && isError && !hasOnchainData
      ? "On-chain battle data could not be loaded from Monad RPC. Showing the local battle copy instead."
      : "";

  return (
    <main>
      <section className="border-b-2 border-ink bg-ink px-4 py-10 text-paper md:px-8">
        <div className="mx-auto max-w-[1440px]">
          {rpcFallbackMessage && (
            <div className="mb-5 max-w-3xl border-2 border-acid bg-acid px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-ink">
              {rpcFallbackMessage}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge className="border-acid bg-acid text-ink">
                {BATTLE_STATUS_LABELS[status]}
              </Badge>
              <span className="font-mono text-xs font-bold text-paper/50">
                #{code}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-paper/55">
              <Clock3 className="h-4 w-4 text-ember" />
              {countdownLabel}
            </div>
          </div>
          <h1 className="display mt-8 max-w-5xl text-5xl font-black leading-[0.93] md:text-8xl">
            {activeBattle.topic}
          </h1>
          <div className="mt-10 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <Player
              handle={activeBattle.challengerHandle}
              label="Challenger"
              align="left"
              active={activeWinner === "challenger"}
            />
            <div className="display grid h-16 w-16 place-items-center rounded-full border-2 border-paper bg-ember text-2xl font-black italic shadow-[4px_4px_0_#d9ff52]">
              VS
            </div>
            <Player
              handle={activeBattle.opponentHandle}
              label="Opponent"
              align="right"
              active={activeWinner === "opponent"}
            />
          </div>
        </div>
      </section>

      <div className="border-b-2 border-ink bg-acid px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-3 text-[11px] font-black uppercase tracking-[0.13em]">
          <span>Stake: {activeBattle.stakeAmount} MON each</span>
          <span>{activeBattle.tweetsPerPlayer} tweets per player</span>
          <span>{100 - activeBattle.aiWeightBps / 100}% community</span>
          <span>{activeBattle.aiWeightBps / 100}% AI judge</span>
          <span>Vote pool: {activeBattle.votePool} MON</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 md:px-8 xl:grid-cols-[1fr_390px]">
        <div className="space-y-8">
          {status === "PendingAcceptance" && (
            <PendingPanel
              key={battleOpponentHandle}
              battle={activeBattle}
              challengeText={challengeText}
              defaultOpponentHandle={battleOpponentHandle}
              onAccept={acceptBattle}
              busy={working === "acceptBattle"}
            />
          )}

          {(status === "Active" ||
            status === "Voting" ||
            status === "Finalized") && (
            <>
              <section>
                <SectionTitle
                  eyebrow="The record"
                  title="Submitted arguments"
                  aside={`${submissions.length}/${activeBattle.tweetsPerPlayer * 2} tweets`}
                />
                <div className="grid gap-5 md:grid-cols-2">
                  {submissions.map((tweet, index) => (
                    <TweetCard key={`${tweet.url}-${index}`} tweet={tweet} />
                  ))}
                  {submissions.length === 0 && (
                    <div className="col-span-2 border-2 border-dashed border-ink p-10 text-center text-sm font-bold text-black/45">
                      No arguments submitted yet. The first move is yours.
                    </div>
                  )}
                </div>
              </section>

              {status === "Active" && (
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <Badge className="bg-mon text-white">
                        Argument studio
                      </Badge>
                      <h2 className="display mt-3 text-4xl font-black">
                        Craft your next move.
                      </h2>
                    </div>
                    <WandSparkles className="h-8 w-8 text-mon" />
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                      <select
                        value={tweetType}
                        onChange={(event) =>
                          setTweetType(event.target.value as TweetType)
                        }
                        className="h-12 border-2 border-ink bg-white px-3 text-sm font-black"
                      >
                        <option>Opening Argument</option>
                        <option>Counterargument</option>
                        <option>Final Statement</option>
                      </select>
                      <div className="flex flex-wrap gap-2">
                        <AssistButton
                          label="Generate opening"
                          busy={working === "generateOpeningArgument"}
                          onClick={() => assist("generateOpeningArgument")}
                        />
                        <AssistButton
                          label="Make sharper"
                          busy={working === "makeItSharper"}
                          onClick={() => assist("makeItSharper")}
                        />
                        <AssistButton
                          label="Make funnier"
                          busy={working === "makeItFunnier"}
                          onClick={() => assist("makeItFunnier")}
                        />
                      </div>
                    </div>
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Write manually for free, or use a premium debate tool..."
                    />
                    <div className="border-2 border-ink bg-white p-4">
                      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-black/45">
                        X composer preview
                      </div>
                      <p className="whitespace-pre-line text-sm font-semibold">
                        {generatedTweet}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row">
                      <Button asChild variant="dark">
                        <a
                          href={generateXIntentUrl(generatedTweet)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open X composer <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <div className="flex flex-1">
                        <Input
                          value={tweetUrl}
                          onChange={(event) => setTweetUrl(event.target.value)}
                          placeholder="Paste posted tweet URL"
                          className="border-r-0"
                        />
                        <Button
                          type="button"
                          onClick={submitTweet}
                          disabled={
                            working === "submitTweet" ||
                            (hasOnchainData &&
                              viewerTweetCount >= activeBattle.tweetsPerPlayer) ||
                            demoSubmissionLimitReached
                          }
                        >
                          Submit URL
                        </Button>
                      </div>
                    </div>
                    {urlError && (
                      <p className="text-xs font-bold text-ember">{urlError}</p>
                    )}
                    <div className="flex items-start gap-2 text-[11px] font-semibold text-black/50">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Monad stores the tweet reference on-chain, not the full
                      tweet body.
                    </div>
                  </CardContent>
                </Card>
              )}

              {(status === "Active" || status === "Voting" || status === "Finalized") && (
                <section>
                  <SectionTitle
                    eyebrow="Community verdict"
                    title="Quadratic voting"
                    aside={`${totalVotes} voting power`}
                  />
                  <Card>
                    <CardContent className="grid gap-7 lg:grid-cols-[1fr_280px]">
                      <div>
                        <div className="mb-3 flex justify-between text-sm font-black">
                          <span>
                            @{activeBattle.challengerHandle} {challengerPercent}%
                          </span>
                          <span>
                            {100 - challengerPercent}% @{activeBattle.opponentHandle}
                          </span>
                        </div>
                        <div className="flex h-7 border-2 border-ink bg-ember">
                          <div
                            className="bg-mon transition-all"
                            style={{ width: `${challengerPercent}%` }}
                          />
                        </div>
                        <div className="mt-7 grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            className={`border-2 border-ink p-4 text-left transition-all ${voteSide === "challenger" ? "bg-mon text-white shadow-hard" : "bg-white"}`}
                            onClick={() => setVoteSide("challenger")}
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Back challenger
                            </span>
                            <strong className="mt-2 block text-lg">
                              @{activeBattle.challengerHandle}
                            </strong>
                          </button>
                          <button
                            type="button"
                            className={`border-2 border-ink p-4 text-left transition-all ${voteSide === "opponent" ? "bg-ember text-white shadow-hard" : "bg-white"}`}
                            onClick={() => setVoteSide("opponent")}
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Back opponent
                            </span>
                            <strong className="mt-2 block text-lg">
                              @{activeBattle.opponentHandle}
                            </strong>
                          </button>
                        </div>
                      </div>
                      <div className="border-2 border-ink bg-white p-5">
                        <label
                          htmlFor="vote-power"
                          className="text-[10px] font-black uppercase tracking-[0.15em]"
                        >
                          Vote power: {votePower}
                        </label>
                        <input
                          id="vote-power"
                          type="range"
                          min="1"
                          max="10"
                          value={votePower}
                          onChange={(event) =>
                            setVotePower(Number(event.target.value))
                          }
                          className="my-5 w-full"
                        />
                        <div className="display text-4xl font-black">
                          {computeQuadraticVoteCost(votePower).toFixed(2)} MON
                        </div>
                        <div className="mt-1 font-mono text-[10px]">
                          0.01 × {votePower}²
                        </div>
                        <Button
                          className="mt-5 w-full"
                          disabled={viewerHasVoted || status === "Finalized" || working === "vote"}
                          onClick={voteBattle}
                        >
                          <Vote className="h-4 w-4" />
                          {viewerHasVoted ? "Vote recorded" : "Fund this verdict"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}

              {(status === "Voting" || status === "Finalized") && aiResult && (
              <ResultPanel
                battle={activeBattle}
                aiResult={aiResult}
                challengerPercent={challengerPercent}
                finalized={status === "Finalized"}
                canFinalize={canFinalize}
                finalizeLabel={hasOnchainData ? "Finalize on-chain" : "Finalize demo result"}
                onFinalize={finalizeBattle}
              />
              )}
            </>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="bg-ink text-paper shadow-hard-acid">
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge className="border-paper/40 text-paper">
                  Battle pool
                </Badge>
                <CircleDollarSign className="h-6 w-6 text-acid" />
              </div>
              <div className="display mt-5 text-6xl font-black">
                {battlePool}
                <span className="ml-2 text-xl">MON</span>
              </div>
              <p className="mt-3 text-sm text-paper/50">
                Two stakes plus every quadratic vote payment. Winner claims the
                entire pool.
              </p>
              {canClaimReward && (
                <Button
                  className="mt-6 w-full"
                  onClick={claimReward}
                  disabled={working === "claimReward"}
                >
                  <Trophy className="h-4 w-4" /> Claim reward
                </Button>
              )}
            </CardContent>
          </Card>

          {status === "Active" && (
            <Card>
              <CardContent>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em]">
                  <Bot className="h-4 w-4 text-mon" /> AI judge
                </div>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-black/55">
                  Scores clarity, logic, relevance, persuasiveness, originality,
                  and rule compliance.
                </p>
                <Button
                  variant="outline"
                  className="mt-5 w-full"
                  onClick={runJudge}
                  disabled={working === "judge"}
                >
                  <Gavel className="h-4 w-4" />
                  {working === "judge"
                    ? "Scoring debate"
                    : "End arguments & run judge"}
                </Button>
                {canMoveToVoting && (
                  <Button
                    variant="dark"
                    className="mt-3 w-full"
                    onClick={moveToVoting}
                    disabled={working === "moveToVoting"}
                  >
                    Move to voting
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {(status === "Voting" || status === "Finalized") && (
            <Card>
              <CardContent>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em]">
                  <Bot className="h-4 w-4 text-mon" /> Resolver preview
                </div>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-black/55">
                  {status === "Voting"
                    ? "Generate the AI preview, then finalize on-chain from the resolver or owner wallet."
                    : "Review the settlement or regenerate the preview if you want to inspect the scoring inputs."}
                </p>
                <Button
                  variant="outline"
                  className="mt-5 w-full"
                  onClick={runJudge}
                  disabled={working === "judge"}
                >
                  <Gavel className="h-4 w-4" />
                  {aiResult ? "Refresh judge preview" : "Generate judge preview"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="border-2 border-ink bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em]">
              <ShieldAlert className="h-4 w-4 text-ember" /> MVP trust model
            </div>
            <ul className="mt-4 space-y-3 text-xs font-semibold leading-relaxed text-black/55">
              <li>• X identity is self-declared.</li>
              <li>• The contract stores tweet references, not tweet bodies.</li>
              <li>• AI judging is off-chain.</li>
              <li>• Finalization uses the owner or resolver wallet on-chain.</li>
            </ul>
          </div>
        </aside>
      </div>

      {notice && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl border-2 border-ink bg-white p-4 text-sm font-semibold shadow-hard">
          {notice}
        </div>
      )}
    </main>
  );
}

function Player({
  handle,
  label,
  align,
  active,
}: {
  handle: string;
  label: string;
  align: "left" | "right";
  active?: boolean;
}) {
  return (
    <div className={align === "right" ? "md:text-right" : ""}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-paper/40">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-3 md:block">
        <div className="display text-4xl font-black md:text-6xl">@{handle}</div>
        {active && (
          <Badge className="mt-2 border-acid bg-acid text-ink">Winner</Badge>
        )}
      </div>
    </div>
  );
}

function PendingPanel({
  battle,
  challengeText,
  defaultOpponentHandle,
  onAccept,
  busy,
}: {
  battle: BattleDetails;
  challengeText: string;
  defaultOpponentHandle: string;
  onAccept: (handle: string) => void;
  busy: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [opponentHandle, setOpponentHandle] = useState(
    () => defaultOpponentHandle,
  );
  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[1fr_340px]">
        <CardContent>
          <Badge className="bg-ember text-white">Waiting for a rival</Badge>
          <h2 className="display mt-4 text-5xl font-black">
            The challenge is public.
          </h2>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-black/55">
            Send the generated challenge to @{battle.opponentHandle}. They can
            accept from any wallet by confirming the handle and matching the{" "}
            {battle.stakeAmount} MON stake.
          </p>
          <div className="mt-6 border-2 border-ink bg-white p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm font-semibold">
              {challengeText}
            </pre>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(challengeText);
                setCopied(true);
              }}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy challenge"}
            </Button>
            <Button asChild variant="outline">
              <a
                href={generateXIntentUrl(challengeText)}
                target="_blank"
                rel="noreferrer"
              >
                Open X <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
        <div className="border-t-2 border-ink bg-acid p-6 lg:border-l-2 lg:border-t-0">
          <div className="text-[11px] font-black uppercase tracking-[0.16em]">
            Are you @{battle.opponentHandle}?
          </div>
          <div className="display mt-3 text-5xl font-black">
            {battle.stakeAmount} MON
          </div>
          <p className="mt-3 text-sm font-semibold">
            Match the stake to start the argument clock.
          </p>
          <Input
            className="mt-5"
            value={opponentHandle}
            onChange={(event) => setOpponentHandle(event.target.value)}
          />
          <Button
            variant="dark"
            className="mt-3 w-full"
            onClick={() => onAccept(opponentHandle)}
            disabled={busy}
          >
            Accept battle <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TweetCard({ tweet }: { tweet: BattleSubmission }) {
  return (
    <article
      className={`border-2 border-ink bg-white p-5 ${tweet.side === "challenger" ? "shadow-[5px_5px_0_#8f7cff]" : "shadow-[5px_5px_0_#ff5b35]"}`}
    >
      <div className="flex items-center justify-between gap-4">
        <Badge
          className={
            tweet.side === "challenger"
              ? "bg-mon text-white"
              : "bg-ember text-white"
          }
        >
          {tweet.type}
        </Badge>
        <span className="text-xs font-black">@{tweet.handle}</span>
      </div>
      <p className="mt-5 text-base font-semibold leading-relaxed">
        {tweet.text}
      </p>
      <a
        href={tweet.url}
        target="_blank"
        rel="noreferrer"
        className="mt-5 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] hover:text-ember"
      >
        View public tweet <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    </article>
  );
}

function AssistButton({
  label,
  busy,
  onClick,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" size="sm" variant="outline" onClick={onClick}>
      <Sparkles className="h-3.5 w-3.5 text-mon" />
      {busy ? "Working" : label}
    </Button>
  );
}

function SectionTitle({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string;
  title: string;
  aside: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-5 border-b-2 border-ink pb-4">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-ember">
          {eyebrow}
        </div>
        <h2 className="display mt-1 text-4xl font-black">{title}</h2>
      </div>
      <span className="font-mono text-[10px] font-bold">{aside}</span>
    </div>
  );
}

function ResultPanel({
  battle,
  aiResult,
  challengerPercent,
  finalized,
  canFinalize,
  finalizeLabel,
  onFinalize,
}: {
  battle: BattleDetails;
  aiResult: JudgeResult;
  challengerPercent: number;
  finalized: boolean;
  canFinalize: boolean;
  finalizeLabel: string;
  onFinalize: () => void;
}) {
  const communityWeight = 1 - battle.aiWeightBps / 10_000;
  const aiWeight = battle.aiWeightBps / 10_000;
  const challengerFinal =
    challengerPercent * communityWeight +
    (aiResult.challengerScore / 100) * aiWeight;
  const opponentFinal =
    (100 - challengerPercent) * communityWeight +
    (aiResult.opponentScore / 100) * aiWeight;
  const challengerWins = challengerFinal >= opponentFinal;

  return (
    <section>
      <SectionTitle
        eyebrow={finalized ? "Final result" : "Resolver preview"}
        title="The verdict"
        aside={finalized ? "Settled on Monad" : "Awaiting finalization"}
      />
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <CardContent className="bg-ink text-paper">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-acid">
              <Bot className="h-4 w-4" /> AI judge summary
            </div>
            <p className="mt-5 text-lg font-semibold leading-relaxed text-paper/75">
              {aiResult.reasoning}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-5">
              <Score
                label={`@${battle.challengerHandle}`}
                value={aiResult.challengerScore / 100}
              />
              <Score
                label={`@${battle.opponentHandle}`}
                value={aiResult.opponentScore / 100}
              />
            </div>
          </CardContent>
          <CardContent className="bg-acid">
            <div className="text-[10px] font-black uppercase tracking-[0.18em]">
              Combined score
            </div>
            <div className="mt-6 space-y-4">
              <FinalRow
                handle={battle.challengerHandle}
                community={challengerPercent}
                ai={aiResult.challengerScore / 100}
                final={challengerFinal}
                winner={challengerWins}
              />
              <FinalRow
                handle={battle.opponentHandle}
                community={100 - challengerPercent}
                ai={aiResult.opponentScore / 100}
                final={opponentFinal}
                winner={!challengerWins}
              />
            </div>
            {!finalized && canFinalize && (
              <Button
                variant="dark"
                className="mt-6 w-full"
                onClick={onFinalize}
              >
                <Gavel className="h-4 w-4" /> {finalizeLabel}
              </Button>
            )}
          </CardContent>
        </div>
      </Card>
    </section>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-wider text-paper/45">
        {label}
      </div>
      <div className="display mt-1 text-5xl font-black">{value.toFixed(1)}</div>
    </div>
  );
}

function FinalRow({
  handle,
  community,
  ai,
  final,
  winner,
}: {
  handle: string;
  community: number;
  ai: number;
  final: number;
  winner: boolean;
}) {
  return (
    <div
      className={`border-2 border-ink p-4 ${winner ? "bg-white shadow-hard" : ""}`}
    >
      <div className="flex items-center justify-between">
        <strong>@{handle}</strong>
        {winner && <Trophy className="h-4 w-4 text-ember" />}
      </div>
      <div className="mt-3 flex justify-between font-mono text-[10px]">
        <span>COMM {community}%</span>
        <span>AI {ai.toFixed(1)}</span>
        <span className="font-black">FINAL {final.toFixed(1)}</span>
      </div>
    </div>
  );
}
