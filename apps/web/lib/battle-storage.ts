import type { Battle } from "@tweetbattle402/shared";

const STORAGE_PREFIX = "tb402:battle:";

const VALID_STATUSES = new Set<Battle["status"]>([
  "PendingAcceptance",
  "Active",
  "Voting",
  "Finalized",
  "Cancelled",
]);

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isValidStatus(value: unknown): value is Battle["status"] {
  return typeof value === "string" && VALID_STATUSES.has(value as Battle["status"]);
}

function normalizeTweetsPerPlayer(value: unknown): Battle["tweetsPerPlayer"] {
  return value === 1 || value === 2 ? value : 3;
}

function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function battleStorageKey(id: number) {
  return `${STORAGE_PREFIX}${id}`;
}

export function parseStoredBattle(raw: string | null): Battle | null {
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<Battle>;
    if (!value || typeof value !== "object") return null;
    if (!isPositiveFiniteNumber(value.id)) return null;
    const topic = normalizeText(value.topic);
    if (!topic) return null;
    if (!isValidStatus(value.status)) return null;

    return {
      id: value.id,
      challenger: normalizeText(value.challenger),
      opponent: normalizeText(value.opponent),
      challengerHandle: normalizeText(value.challengerHandle),
      opponentHandle: normalizeText(value.opponentHandle),
      topic,
      stakeAmount: normalizeText(value.stakeAmount, "0"),
      tweetsPerPlayer: normalizeTweetsPerPlayer(value.tweetsPerPlayer),
      status: value.status,
      endTime: normalizeNumber(value.endTime),
      votingEndTime: normalizeNumber(value.votingEndTime),
      aiWeightBps: normalizeNumber(value.aiWeightBps),
      challengerVotePower: normalizeNumber(value.challengerVotePower),
      opponentVotePower: normalizeNumber(value.opponentVotePower),
      votePool: normalizeText(value.votePool, "0"),
    };
  } catch {
    return null;
  }
}

export function readStoredBattle(id: number): Battle | null {
  if (typeof window === "undefined") return null;
  return parseStoredBattle(window.localStorage.getItem(battleStorageKey(id)));
}

export function writeStoredBattle(battle: Battle) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(battleStorageKey(battle.id), JSON.stringify(battle));
  } catch {
    // Local storage is a best-effort fallback.
  }
}

export function selectBattleSeed(
  id: number,
  storedBattle: Battle | null,
  demoBattles: Battle[],
) {
  if (storedBattle?.id === id) return storedBattle;
  return demoBattles.find((battle) => battle.id === id) ?? null;
}

export function buildStoredBattleDraft(input: {
  id: number;
  challenger: string;
  challengerHandle: string;
  opponentHandle: string;
  topic: string;
  stakeAmount: string;
  tweetsPerPlayer: Battle["tweetsPerPlayer"];
  endTime: number;
  aiWeightBps: number;
}): Battle {
  return {
    id: input.id,
    challenger: input.challenger,
    opponent: "",
    challengerHandle: input.challengerHandle,
    opponentHandle: input.opponentHandle,
    topic: input.topic,
    stakeAmount: input.stakeAmount,
    tweetsPerPlayer: input.tweetsPerPlayer,
    status: "PendingAcceptance",
    endTime: input.endTime,
    votingEndTime: 0,
    aiWeightBps: input.aiWeightBps,
    challengerVotePower: 0,
    opponentVotePower: 0,
    votePool: "0",
  };
}
