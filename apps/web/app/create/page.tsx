import type { Metadata } from "next";
import { CreateBattlePage } from "@/components/create-battle-page";

export const metadata: Metadata = {
  title: "Create a battle — TweetBattle402",
  description: "Set a topic, challenge an X handle, and escrow MON.",
};

export default function CreatePage() {
  return <CreateBattlePage />;
}
