# TweetBattle402

> TweetBattle402 turns X debates into stake-backed battles. Anyone can challenge a user to a topic-based tweet duel, both sides escrow MON, each side posts a fixed number of tweets, the community votes with quadratic voting, an AI judge scores argument quality, and the winner claims the pool. X is the public arena; Monad is the escrow, voting, reward, and reputation layer. No X API required.

## Workspace

```text
apps/web/             Next.js App Router frontend and AI API routes
packages/contracts/   Hardhat project with TweetBattleArena.sol
packages/shared/      Types, ABI, chain config, vote math, and X helpers
packages/ai/          Judge prompt, mock judge, and debate assistant tools
```

## Run locally

Requirements: Node.js 22+ and pnpm 10+.

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

Open `http://localhost:3000`. Without `NEXT_PUBLIC_CONTRACT_ADDRESS`, the app runs in demo mode and stores newly created battles in local storage. With an address configured, the create flow requests a real Monad testnet transaction.

## Contracts

```bash
pnpm contracts:compile
pnpm contracts:test
pnpm contracts:deploy
```

Deployment requires testnet MON and `RESOLVER_PRIVATE_KEY`. The deploy script writes the artifact and deployment metadata into `packages/shared/src/generated`.

Current deployment address: `0x3B2Acbda1b05363d7a70ae040C816f6a8fA348C2` on Monad testnet.

## Demo script

1. Connect an injected wallet configured for Monad testnet.
2. Create a battle, or use demo battle `#405` to see pending acceptance.
3. Copy the generated challenge or open the X intent composer.
4. Accept, generate an argument, post manually, and paste an X status URL.
5. Buy quadratic voting power and inspect the live community split.
6. Run the deterministic AI judge, finalize the demo result, and reveal claim state.
7. Use battle `#399` for an already-finalized result.

## Production deployment

- Cloud Run service: `tweetbattle402-web`
- Custom domain: `tweetbattle402.xyz`
- `cloudbuild.yaml` is ready for a `main`-branch trigger that builds the Docker image, runs workspace checks, and deploys the app to Cloud Run.
- Public production env vars:
  - `NEXT_PUBLIC_CHAIN_ID=10143`
  - `NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz`
  - `NEXT_PUBLIC_CONTRACT_ADDRESS=0x3B2Acbda1b05363d7a70ae040C816f6a8fA348C2`
  - `NEXT_PUBLIC_BASE_VOTE_PRICE=0.01`
  - `NEXT_PUBLIC_APP_URL=https://tweetbattle402.xyz`
- `OPENAI_API_KEY` should live in Secret Manager and be injected into Cloud Run at runtime.

## Trust and security assumptions

- X handles and tweet ownership are self-declared.
- Tweet URL validation checks shape only; it does not verify author or content.
- AI judging is off-chain. The MVP resolver/owner is trusted to submit scores.
- Voting is one-time per wallet and is not sybil resistant.
- The contracts are unaudited testnet software.
- Reward payouts use a pull-based claim with `ReentrancyGuard`; value-moving acceptance, voting, cancellation, emergency cancellation, and claiming are guarded.

## Roadmap

- Optional X OAuth and economically viable official API verification
- Decentralized multi-agent judging and signed attestations
- Optimistic dispute windows and oracle-based resolution
- Anti-sybil and reputation-weighted voting
- Content-addressed tweet metadata and event indexing
- x402-protected MCP debate tools
- Production deployment, formal review, and contract audit
