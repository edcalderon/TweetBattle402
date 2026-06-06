import type { Metadata } from "next";
import { BattlesPage } from "@/components/battles-page";

export const metadata: Metadata = {
  title: "Explore battles — TweetBattle402",
  description: "Browse live, pending, and settled tweet battles on Monad.",
};

export default function BattlesRoute() {
  return <BattlesPage />;
}
