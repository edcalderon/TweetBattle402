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

      <footer className="border-t-2 border-ink bg-ink px-4 py-6 text-paper md:px-8 md:py-7">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="font-serif text-2xl font-bold italic md:text-3xl">
                Stake your words.
              </div>
              <p className="mt-2 max-w-lg text-xs leading-relaxed text-paper/55 md:text-sm">
                X is the public arena. Monad handles escrow, voting, rewards,
                and reputation.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-paper/45 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:max-w-2xl">
              <span>{MONAD_TESTNET_CHAIN.name}</span>
              <span className="hidden text-paper/20 sm:inline">•</span>
              <span className="text-paper/65">v{appVersion}</span>
              <span className="hidden text-paper/20 sm:inline">•</span>
              <span className="font-mono normal-case tracking-normal text-paper/60">
                {contractDisplay ?? "Contract address unavailable"}
              </span>
              <span className="hidden text-paper/20 sm:inline">•</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-paper/80 transition-colors hover:text-acid"
              >
                {explorerName}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
