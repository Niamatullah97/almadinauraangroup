# ── Base stage: install dependencies ──
FROM node:20-alpine AS base
# bcrypt needs a native addon; Alpine has no prebuilt binary without these tools
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/eslint-config/package.json ./packages/eslint-config/

RUN pnpm install --frozen-lockfile || pnpm install

# ── Development target ──
FROM base AS development
COPY . .
RUN pnpm db:generate && pnpm --filter @kabootar/shared build
CMD ["pnpm", "--filter", "@kabootar/api", "dev"]

# ── Build stage ──
FROM base AS build
COPY . .
RUN pnpm db:generate \
  && pnpm --filter @kabootar/shared build \
  && pnpm --filter @kabootar/database build \
  && pnpm --filter @kabootar/api build

# ── Production stage ──
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/assets ./apps/api/assets
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./
COPY --from=build /app/packages/database/prisma ./packages/database/prisma
COPY --from=build /app/pnpm-workspace.yaml ./
COPY --from=build /app/pnpm-lock.yaml ./
COPY docker/api-entrypoint.sh ./docker/api-entrypoint.sh

RUN chmod +x ./docker/api-entrypoint.sh

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1

ENTRYPOINT ["./docker/api-entrypoint.sh"]
