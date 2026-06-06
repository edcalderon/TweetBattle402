import Link from "next/link";
import { ArrowUpRight, Swords } from "lucide-react";
import { WalletButton } from "@/components/wallet-button";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-black uppercase tracking-[-0.04em]"
          >
            <span className="grid h-8 w-8 place-items-center bg-ink text-acid">
              <Swords className="h-4 w-4" />
            </span>
            TweetBattle<span className="text-ember">402</span>
          </Link>
          <nav className="hidden items-center gap-7 text-xs font-black uppercase tracking-[0.13em] md:flex">
            <Link href="/battles" className="hover:text-ember">
              Explore
            </Link>
            <Link href="/create" className="hover:text-ember">
              Create
            </Link>
            <a
              href="https://testnet.monadexplorer.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-mon"
            >
              Monad <ArrowUpRight className="h-3 w-3" />
            </a>
          </nav>
          <WalletButton />
        </div>
      </header>
      {children}
      <footer className="border-t-2 border-ink bg-ink px-4 py-10 text-paper md:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 md:flex-row">
          <div>
            <div className="font-serif text-3xl font-bold italic">
              Stake your words.
            </div>
            <p className="mt-2 max-w-lg text-sm text-paper/55">
              X is the public arena. Monad is the escrow, voting, reward, and
              reputation layer. No X API required.
            </p>
          </div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-paper/50">
            MVP · Monad Testnet · Trusted Resolver
          </div>
        </div>
      </footer>
    </div>
  );
}
