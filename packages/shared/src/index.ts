import { defineChain, formatEther, parseEther } from "viem";

export enum BattleStatus {
  PendingAcceptance,
  Active,
  Voting,
  Finalized,
  Cancelled,
}

export type BattleSide = "challenger" | "opponent";
export type BattleStatusName =
  | "PendingAcceptance"
  | "Active"
  | "Voting"
  | "Finalized"
  | "Cancelled";
export type TweetType =
  | "Opening Argument"
  | "Counterargument"
  | "Final Statement";

export interface Battle {
  id: number;
  challenger: string;
  opponent: string;
  challengerHandle: string;
  opponentHandle: string;
  topic: string;
  stakeAmount: string;
  tweetsPerPlayer: 1 | 2 | 3;
  status: BattleStatusName;
  endTime: number;
  votingEndTime: number;
  aiWeightBps: number;
  challengerVotePower: number;
  opponentVotePower: number;
  votePool: string;
}

export const MONAD_TESTNET_CHAIN = defineChain({
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 10143),
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_MONAD_RPC_URL ??
          "https://testnet-rpc.monad.xyz",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Vision",
      url: "https://testnet.monadvision.com",
    },
  },
  testnet: true,
});

export const BASE_VOTE_PRICE_MON = Number(
  process.env.NEXT_PUBLIC_BASE_VOTE_PRICE ?? 0.01,
);

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const BATTLE_STATUS_LABELS = {
  PendingAcceptance: "Pending acceptance",
  Active: "Arguments live",
  Voting: "Community voting",
  Finalized: "Settled on Monad",
  Cancelled: "Cancelled",
} as const;

export function computeQuadraticVoteCost(
  votePower: number,
  basePrice = BASE_VOTE_PRICE_MON,
) {
  return basePrice * votePower * votePower;
}

export function voteCostWei(votePower: number) {
  return parseEther(computeQuadraticVoteCost(votePower).toString());
}

export function formatMon(value: bigint | string | number, digits = 2) {
  const amount =
    typeof value === "bigint" ? Number(formatEther(value)) : Number(value);
  return `${amount.toFixed(digits)} MON`;
}

export function buildBattleCode(id: string | number) {
  return `TB402-${id}`;
}

export function buildBattleUrl(id: string | number) {
  return new URL(`/battle/${id}`, APP_URL).toString();
}

export function validateTweetUrl(value: string) {
  return /^https?:\/\/(www\.)?(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+/i.test(
    value.trim(),
  );
}

export function generateXIntentUrl(text: string) {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function buildChallengeTweet(input: {
  opponentHandle: string;
  topic: string;
  stake: string;
  tweets: number;
  battleId: number | string;
  battleUrl: string;
}) {
  const opponent = input.opponentHandle.replace(/^@/, "");
  return `@${opponent}, stake your words.\n\nTopic: ${input.topic}\nStake: ${input.stake} MON each\nFormat: ${input.tweets} tweet${input.tweets === 1 ? "" : "s"} per side\n\nAccept: ${input.battleUrl}\n#${buildBattleCode(input.battleId)} #TweetBattle402 #Monad`;
}

export function buildExplorerLink(type: 'address' | 'tx', value: string) {
  const baseUrl = MONAD_TESTNET_CHAIN.blockExplorers?.default?.url ?? "https://testnet.monadvision.com";
  switch (type) {
    case 'address':
      return `${baseUrl}/address/${value}`;
    case 'tx':
      return `${baseUrl}/tx/${value}`;
  }
}

export function buildContractExplorerLink() {
  const { CONTRACT_ADDRESSES } = require("./generated/addresses");
  const contractAddress = CONTRACT_ADDRESSES[MONAD_TESTNET_CHAIN.id];
  return contractAddress ? buildExplorerLink('address', contractAddress) : null;
}

export { CONTRACT_ADDRESSES } from "./generated/addresses";
export { tweetBattleArenaAbi } from "./generated/TweetBattleArena.abi";
