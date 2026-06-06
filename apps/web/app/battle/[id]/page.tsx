import type { Metadata } from "next";
import { BattleRoomPage } from "@/components/battle-room-page";

export const metadata: Metadata = {
  title: "Battle room — TweetBattle402",
  description:
    "Follow the arguments, fund a quadratic verdict, and inspect the final settlement.",
};

export default function BattlePage() {
  return <BattleRoomPage />;
}
