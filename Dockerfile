FROM node:22-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

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
