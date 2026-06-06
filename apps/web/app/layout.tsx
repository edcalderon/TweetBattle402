import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "@/components/providers";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "TweetBattle402 — Stake your words",
  description:
    "Structured, stake-backed tweet battles settled on Monad. No X API required.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
