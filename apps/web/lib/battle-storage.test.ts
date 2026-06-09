import assert from "node:assert/strict";
import test from "node:test";
import type { Battle } from "@tweetbattle402/shared";
import {
  battleStorageKey,
  buildStoredBattleDraft,
  parseStoredBattle,
  selectBattleSeed,
} from "./battle-storage";

const demoBattles: Battle[] = [
  {
    id: 402,
    challenger: "0x01",
    opponent: "0x02",
    challengerHandle: "chainpoet",
    opponentHandle: "rollupmaxi",
    topic: "Demo topic",
    stakeAmount: "12",
    tweetsPerPlayer: 3,
    status: "Active",
    endTime: 123,
    votingEndTime: 456,
    aiWeightBps: 3000,
    challengerVotePower: 34,
    opponentVotePower: 27,
    votePool: "8.42",
  },
];

test("battleStorageKey namespaces battle ids", () => {
  assert.equal(battleStorageKey(512), "tb402:battle:512");
});

test("parseStoredBattle accepts valid battle JSON", () => {
  const stored = buildStoredBattleDraft({
    id: 700,
    challenger: "Connected wallet",
    challengerHandle: "you",
    opponentHandle: "tester",
    topic: "Will this fallback render?",
    stakeAmount: "5",
    tweetsPerPlayer: 2,
    endTime: 123456,
    aiWeightBps: 3000,
  });

  assert.deepEqual(parseStoredBattle(JSON.stringify(stored)), stored);
});

test("parseStoredBattle rejects malformed JSON", () => {
  assert.equal(parseStoredBattle("{not-json"), null);
  assert.equal(parseStoredBattle(JSON.stringify({ topic: "" })), null);
});

test("selectBattleSeed prefers stored battles for the requested id", () => {
  const stored = buildStoredBattleDraft({
    id: 700,
    challenger: "Connected wallet",
    challengerHandle: "you",
    opponentHandle: "tester",
    topic: "Will this fallback render?",
    stakeAmount: "5",
    tweetsPerPlayer: 2,
    endTime: 123456,
    aiWeightBps: 3000,
  });

  assert.equal(selectBattleSeed(700, stored, demoBattles), stored);
  assert.equal(selectBattleSeed(402, null, demoBattles)?.id, 402);
  assert.equal(selectBattleSeed(999, null, demoBattles), null);
});
