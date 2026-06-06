import Link from "next/link";
import { ArrowUpRight, Clock3, Coins, MessageSquareText } from "lucide-react";
import { BATTLE_STATUS_LABELS, type Battle } from "@tweetbattle402/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const statusStyle = {
  PendingAcceptance: "bg-white",
  Active: "bg-acid",
  Voting: "bg-mon text-white",
  Finalized: "bg-ink text-paper",
  Cancelled: "bg-black/10",
} as const;

const statusSummary = {
  PendingAcceptance: "Pending",
  Active: "Live",
  Voting: "Voting",
  Finalized: "Settled",
  Cancelled: "Cancelled",
} as const;

export function BattleCard({ battle }: { battle: Battle }) {
  return (
    <Link href={`/battle/${battle.id}`} className="group block">
      <Card className="h-full transition-all group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0_#11100e]">
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <Badge className={statusStyle[battle.status]}>
              {BATTLE_STATUS_LABELS[battle.status]}
            </Badge>
            <span className="font-mono text-xs font-bold">#{battle.id}</span>
          </div>
          <h3 className="display mt-7 text-3xl font-black leading-[0.96]">
            {battle.topic}
          </h3>
          <div className="mt-7 flex items-center gap-3 border-y-2 border-ink py-3 text-sm font-black">
            <span>@{battle.challengerHandle}</span>
            <span className="rounded-full bg-ember px-2 py-1 text-[10px] text-white">
              VS
            </span>
            <span>@{battle.opponentHandle}</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-[11px] font-bold uppercase tracking-[0.08em]">
            <div>
              <Coins className="mb-1 h-4 w-4 text-ember" />
              {battle.stakeAmount} MON
            </div>
            <div>
              <MessageSquareText className="mb-1 h-4 w-4 text-mon" />
              {battle.tweetsPerPlayer} tweets
            </div>
            <div>
              <Clock3 className="mb-1 h-4 w-4" />
              {statusSummary[battle.status]}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-black/15 pt-4 text-xs font-black uppercase tracking-[0.12em]">
            Enter arena
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
