import {
  CONTRACT_ADDRESSES,
  MONAD_TESTNET_CHAIN,
  type Battle,
  type BattleSide,
  type BattleStatusName,
  type TweetType,
  tweetBattleArenaAbi,
} from "@tweetbattle402/shared";
import {
  formatEther,
  isAddressEqual,
  parseEventLogs,
  zeroAddress,
  type Address,
  type PublicClient,
  type TransactionReceipt,
} from "viem";

export const TWEET_BATTLE_ARENA_ADDRESS =
  CONTRACT_ADDRESSES[MONAD_TESTNET_CHAIN.id];

export const tweetBattleArenaContract = TWEET_BATTLE_ARENA_ADDRESS
  ? {
      address: TWEET_BATTLE_ARENA_ADDRESS,
      abi: tweetBattleArenaAbi,
    }
  : undefined;

const BATTLE_STATUS_NAMES = [
  "PendingAcceptance",
  "Active",
  "Voting",
  "Finalized",
  "Cancelled",
] as const satisfies readonly BattleStatusName[];

type OnchainBattleTuple = readonly [
  Address,
  Address,
  string,
  string,
  string,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  Address,
  bigint,
  boolean,
  bigint,
  bigint,
];

export interface BattleDetails extends Battle {
  challengerWallet: Address;
  opponentWallet: Address;
  winner: Address;
  rewardClaimed: boolean;
  createdAt: number;
  startTime: number;
  duration: number;
  votingDuration: number;
  communityWeightBps: number;
}

export interface BattleSubmission {
  side: BattleSide;
  type: TweetType;
  handle: string;
  text: string;
  url: string;
  author: Address;
  submissionNumber: number;
}

function toStatusName(value: bigint): BattleStatusName {
  return BATTLE_STATUS_NAMES[Number(value)] ?? "Active";
}

function toTweetsPerPlayer(value: bigint): 1 | 2 | 3 {
  const normalized = Number(value);
  if (normalized <= 1) return 1;
  if (normalized === 2) return 2;
  return 3;
}

function toBattle(id: number, data: OnchainBattleTuple): BattleDetails {
  const [
    challengerWallet,
    opponentWallet,
    challengerHandle,
    opponentHandle,
    topic,
    stakeAmount,
    tweetsPerPlayer,
    createdAt,
    startTime,
    endTime,
    votingEndTime,
    aiWeightBps,
    communityWeightBps,
    challengerVotePower,
    opponentVotePower,
    votePool,
    winner,
    status,
    rewardClaimed,
    duration,
    votingDuration,
  ] = data;

  return {
    id,
    challenger: challengerWallet,
    opponent: opponentWallet === zeroAddress ? "" : opponentWallet,
    challengerHandle,
    opponentHandle,
    topic,
    stakeAmount: formatEther(stakeAmount),
    tweetsPerPlayer: toTweetsPerPlayer(tweetsPerPlayer),
    status: toStatusName(status),
    endTime: Number(endTime) * 1000,
    votingEndTime: Number(votingEndTime) * 1000,
    aiWeightBps: Number(aiWeightBps),
    challengerVotePower: Number(challengerVotePower),
    opponentVotePower: Number(opponentVotePower),
    votePool: formatEther(votePool),
    winner,
    rewardClaimed,
    challengerWallet,
    opponentWallet,
    createdAt: Number(createdAt) * 1000,
    startTime: Number(startTime) * 1000,
    duration: Number(duration) * 1000,
    votingDuration: Number(votingDuration) * 1000,
    communityWeightBps: Number(communityWeightBps),
  };
}

function toTweetType(submissionNumber: number, tweetsPerPlayer: number): TweetType {
  if (submissionNumber === 1) return "Opening Argument";
  if (submissionNumber >= tweetsPerPlayer && tweetsPerPlayer > 1) {
    return "Final Statement";
  }
  return "Counterargument";
}

export function parseBattleCreatedIdFromReceipt(
  receipt: TransactionReceipt,
): number | null {
  const logs = parseEventLogs({
    abi: tweetBattleArenaAbi,
    eventName: "BattleCreated",
    logs: receipt.logs,
  }) as Array<{ args: { battleId: bigint } }>;
  const created = logs[0];
  return created ? Number(created.args.battleId) : null;
}

export async function fetchBattle(
  publicClient: PublicClient | undefined,
  battleId: number,
): Promise<BattleDetails | null> {
  if (!publicClient || !TWEET_BATTLE_ARENA_ADDRESS || battleId <= 0) return null;

  const nextBattleId = (await publicClient.readContract({
    address: TWEET_BATTLE_ARENA_ADDRESS,
    abi: tweetBattleArenaAbi,
    functionName: "nextBattleId",
  })) as bigint;

  if (BigInt(battleId) >= nextBattleId) return null;

  const data = (await publicClient.readContract({
    address: TWEET_BATTLE_ARENA_ADDRESS,
    abi: tweetBattleArenaAbi,
    functionName: "battles",
    args: [BigInt(battleId)],
  })) as OnchainBattleTuple;

  if (data[0] === zeroAddress && data[2].length === 0) return null;
  return toBattle(battleId, data);
}

export async function fetchBattles(
  publicClient: PublicClient | undefined,
): Promise<Battle[]> {
  if (!publicClient || !TWEET_BATTLE_ARENA_ADDRESS) return [];

  const nextBattleId = (await publicClient.readContract({
    address: TWEET_BATTLE_ARENA_ADDRESS,
    abi: tweetBattleArenaAbi,
    functionName: "nextBattleId",
  })) as bigint;

  const count = Number(nextBattleId - 1n);
  if (count <= 0) return [];

  const contracts = Array.from({ length: count }, (_, index) => ({
    address: TWEET_BATTLE_ARENA_ADDRESS,
    abi: tweetBattleArenaAbi,
    functionName: "battles" as const,
    args: [BigInt(index + 1)],
  }));

  const results = await publicClient.multicall({
    contracts,
    allowFailure: false,
  });

  return results
    .map((result, index) => toBattle(index + 1, result as OnchainBattleTuple))
    .sort((left, right) => right.id - left.id);
}

export async function fetchBattleSubmissions(
  publicClient: PublicClient | undefined,
  battle: BattleDetails,
): Promise<BattleSubmission[]> {
  if (!publicClient || !TWEET_BATTLE_ARENA_ADDRESS) return [];

  const logs = (await publicClient.getContractEvents({
    address: TWEET_BATTLE_ARENA_ADDRESS,
    abi: tweetBattleArenaAbi,
    eventName: "TweetSubmitted",
    args: { battleId: BigInt(battle.id) },
    fromBlock: 0n,
    toBlock: "latest",
  })) as Array<{
    args: {
      player: Address;
      submissionNumber: bigint;
      tweetUrl: string;
    };
  }>;

  return logs.map((event) => {
    const player = event.args.player;
    const side: BattleSide = isAddressEqual(player, battle.challengerWallet)
      ? "challenger"
      : "opponent";
    const submissionNumber = Number(event.args.submissionNumber);
    return {
      side,
      type: toTweetType(submissionNumber, battle.tweetsPerPlayer),
      handle: side === "challenger" ? battle.challengerHandle : battle.opponentHandle,
      text: event.args.tweetUrl,
      url: event.args.tweetUrl,
      author: player,
      submissionNumber,
    };
  });
}

export async function fetchBattleRoomData(
  publicClient: PublicClient | undefined,
  battleId: number,
  viewerAddress?: Address,
): Promise<{
  battle: BattleDetails;
  submissions: BattleSubmission[];
  viewerHasVoted: boolean;
  viewerTweetCount: number;
  owner: Address | null;
  resolver: Address | null;
} | null> {
  const battle = await fetchBattle(publicClient, battleId);
  if (!battle) return null;
  if (!publicClient || !TWEET_BATTLE_ARENA_ADDRESS) return null;

  const [submissions, viewerHasVoted, viewerTweetCount, owner, resolver] =
    await Promise.all([
      fetchBattleSubmissions(publicClient, battle),
      viewerAddress
        ? publicClient.readContract({
            address: TWEET_BATTLE_ARENA_ADDRESS!,
            abi: tweetBattleArenaAbi,
            functionName: "hasVoted",
            args: [BigInt(battleId), viewerAddress],
          })
        : Promise.resolve(false),
      viewerAddress
        ? publicClient.readContract({
            address: TWEET_BATTLE_ARENA_ADDRESS!,
            abi: tweetBattleArenaAbi,
            functionName: "tweetCount",
            args: [BigInt(battleId), viewerAddress],
          })
        : Promise.resolve(0n),
      publicClient.readContract({
        address: TWEET_BATTLE_ARENA_ADDRESS!,
        abi: tweetBattleArenaAbi,
        functionName: "owner",
      }) as Promise<Address>,
      publicClient.readContract({
        address: TWEET_BATTLE_ARENA_ADDRESS!,
        abi: tweetBattleArenaAbi,
        functionName: "resolver",
      }) as Promise<Address>,
    ]);

  return {
    battle,
    submissions,
    viewerHasVoted: Boolean(viewerHasVoted),
    viewerTweetCount: Number(viewerTweetCount),
    owner,
    resolver,
  };
}
