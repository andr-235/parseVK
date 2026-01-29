# syntax=docker/dockerfile:1.4
# Build stage
FROM oven/bun:1-alpine AS build

WORKDIR /app

ARG DATABASE_URL=postgresql://localhost:5432/dummy
ARG BUILDKIT_INLINE_CACHE=1

# Переменные окружения для pnpm и prisma
ENV DATABASE_URL=${DATABASE_URL}
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Настройки для node-gyp
ENV NODEJS_ORG_MIRROR=https://nodejs.org/dist/

# Copy package files first for better layer caching
COPY api/package*.json ./
COPY api/bun.lock ./

# Нативные зависимости (argon2) требуют сборки в Alpine/musl
RUN apk add --no-cache --virtual .build-deps python3 build-base

# Install dependencies
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

RUN apk del .build-deps

# Copy source code after dependencies are installed
COPY api/ ./

RUN rm -f .env

# Generate Prisma Client and build (retry on transient network errors in CI)
# Use tsc (not nest build): output stays in dist/src/ and matches entrypoint; nest build
# puts entry at dist/main.js and modules in dist/src/, causing ERR_MODULE_NOT_FOUND for ./app.module.
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN for i in 1 2 3; do \
      bun run prisma:generate && break; \
      echo "prisma generate attempt $$i failed, retrying in 15s..."; \
      sleep 15; \
    done \
    && bunx tsc -p tsconfig.build.json \
    && (test -f /app/dist/src/main.js || test -f /app/dist/main.js) || (echo "Build failed: main.js not found" && ls -laR /app/dist && exit 1)

# Production stage
FROM oven/bun:1-alpine

WORKDIR /app

ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/vk_api?schema=public
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_ENV=production

RUN apk add --no-cache netcat-openbsd

COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/node_modules ./node_modules

# Копируем entrypoint и healthcheck
COPY docker/backend-entrypoint.sh /app/entrypoint.sh
COPY docker/backend-healthcheck.mjs /app/healthcheck.mjs
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=120s \
  CMD ["bun", "/app/healthcheck.mjs"]
