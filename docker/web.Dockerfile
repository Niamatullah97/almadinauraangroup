FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile || pnpm install

FROM base AS build
COPY . .
# Next.js standalone copies public/ only when it exists; keep an empty dir so the production COPY never fails.
RUN mkdir -p apps/web/public
RUN pnpm --filter @kabootar/shared build \
  && pnpm --filter @kabootar/web build

FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3001
CMD ["node", "apps/web/server.js"]
