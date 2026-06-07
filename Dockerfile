FROM node:22-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

ARG NEXT_PUBLIC_CHAIN_ID=10143
ARG NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
ARG NEXT_PUBLIC_CONTRACT_ADDRESS=0x3B2Acbda1b05363d7a70ae040C816f6a8fA348C2
ARG NEXT_PUBLIC_BASE_VOTE_PRICE=0.01
ARG NEXT_PUBLIC_APP_URL=https://tweetbattle402.xyz

ENV NEXT_PUBLIC_CHAIN_ID=${NEXT_PUBLIC_CHAIN_ID}
ENV NEXT_PUBLIC_MONAD_RPC_URL=${NEXT_PUBLIC_MONAD_RPC_URL}
ENV NEXT_PUBLIC_CONTRACT_ADDRESS=${NEXT_PUBLIC_CONTRACT_ADDRESS}
ENV NEXT_PUBLIC_BASE_VOTE_PRICE=${NEXT_PUBLIC_BASE_VOTE_PRICE}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ai/package.json packages/ai/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @tweetbattle402/web build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "run", "start"]
