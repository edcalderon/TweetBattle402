import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: "TweetBattle402 — Stake-backed debates on Monad",
  description:
    "Challenge anyone on X, escrow MON, debate in a fixed format, and settle the result with community and AI judging.",
};

export default function Home() {
  return <LandingPage />;
}
