"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ExternalLink, Menu, Swords, X } from "lucide-react";
import { CONTRACT_ADDRESSES, MONAD_TESTNET_CHAIN } from "@tweetbattle402/shared";
import appPackageJson from "../package.json";
import { WalletButton } from "@/components/wallet-button";

const navLinks = [
  { href: "/battles", label: "Explore" },
  { href: "/create", label: "Create" },
];

const appVersion = appPackageJson.version;

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const explorer = MONAD_TESTNET_CHAIN.blockExplorers?.default;
  const explorerName = "Monad Testnet Explorer";
  const explorerUrl = explorer?.url ?? "https://testnet.monadvision.com";
  const contractAddress = CONTRACT_ADDRESSES[MONAD_TESTNET_CHAIN.id];
  const contractDisplay = contractAddress
    ? `${contractAddress.slice(0, 10)}...${contractAddress.slice(-8)}`
    : null;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-black uppercase tracking-[-0.04em]"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="grid h-8 w-8 place-items-center bg-ink text-acid">
              <Swords className="h-4 w-4" />
            </span>
            TweetBattle<span className="text-ember">402</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 text-xs font-black uppercase tracking-[0.13em] md:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={pathname === href ? "text-ember" : "hover:text-ember"}
              >
                {label}
              </Link>
            ))}
            <a
              href="https://testnet.monadexplorer.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-mon"
            >
              Monad <ArrowUpRight className="h-3 w-3" />
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <WalletButton />
            {/* Hamburger */}
            <button
              className="grid h-9 w-9 place-items-center border-2 border-ink md:hidden"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t-2 border-ink bg-paper md:hidden">
            <nav className="flex flex-col">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="border-b border-ink/20 px-6 py-4 text-sm font-black uppercase tracking-[0.13em] hover:bg-ink hover:text-paper"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <a
                href="https://testnet.monadexplorer.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 border-b border-ink/20 px-6 py-4 text-sm font-black uppercase tracking-[0.13em] hover:bg-ink hover:text-paper"
                onClick={() => setMobileMenuOpen(false)}
              >
                Monad Explorer <ArrowUpRight className="h-3 w-3" />
              </a>
            </nav>
          </div>
        )}
      </header>

      {children}

      <footer className="border-t-2 border-ink bg-ink px-4 py-10 text-paper md:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="font-serif text-3xl font-bold italic md:text-4xl">
                Stake your words.
              </div>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-paper/55">
                X is the public arena. Monad is the escrow, voting, reward,
                and reputation layer. No X API required.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-paper/45">
                <span className="rounded-full border border-paper/15 px-3 py-1">
                  MVP
                </span>
                <span className="rounded-full border border-paper/15 px-3 py-1">
                  Monad Testnet
                </span>
                <span className="rounded-full border border-paper/15 px-3 py-1">
                  Trusted Resolver
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-paper/10 bg-paper/5 p-4 sm:p-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-paper/45">
                  Network & Contract
                </div>
                <div className="mt-4 text-sm font-bold text-paper">
                  {MONAD_TESTNET_CHAIN.name}
                </div>
                <div className="mt-2 font-mono text-[11px] leading-relaxed text-paper/55 break-all">
                  {contractDisplay ?? "Contract address unavailable"}
                </div>
              </div>

              <div className="border border-paper/10 bg-paper/5 p-4 sm:p-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-paper/45">
                  Release
                </div>
                <div className="mt-4 text-sm font-bold text-paper">
                  v{appVersion}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-paper/55">
                  Synced across the workspace and Cloud Build image tag.
                </p>
              </div>

              <div className="border border-paper/10 bg-paper/5 p-4 sm:col-span-2 sm:p-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-paper/45">
                  Explorer
                </div>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-paper transition-colors hover:text-acid"
                >
                  {explorerName}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <p className="mt-2 text-xs leading-relaxed text-paper/55">
                  Inspect Monad transactions, contracts, and battle activity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
