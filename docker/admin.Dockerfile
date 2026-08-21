FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile || pnpm install

FROM base AS build
COPY . .
RUN pnpm --filter @kabootar/shared build \
  && pnpm --filter @kabootar/admin build --configuration=production

FROM nginx:1.27-alpine AS production
COPY docker/nginx-admin.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist/admin/browser /usr/share/nginx/html/admin

EXPOSE 80
