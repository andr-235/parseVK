# syntax=docker/dockerfile:1.4
# Build stage
FROM node:22-alpine AS build

WORKDIR /app

ARG DATABASE_URL=postgresql://localhost:5432/dummy
ARG NPM_REGISTRY=https://registry.npmmirror.com
ARG NPM_REGISTRY_FALLBACK=https://registry.npmjs.org/
ARG PNPM_VERSION=10.25.0
ARG BUILDKIT_INLINE_CACHE=1

# Переменные окружения для pnpm и prisma
ENV DATABASE_URL=${DATABASE_URL}
ENV npm_config_registry=${NPM_REGISTRY}
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Настройки для node-gyp
ENV NODEJS_ORG_MIRROR=https://nodejs.org/dist/
ENV npm_config_node_gyp_timeout=300000

RUN npm config set registry ${NPM_REGISTRY} \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 3 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-timeout 180000 \
    && (npm install -g pnpm@${PNPM_VERSION} --registry=${NPM_REGISTRY} || \
        npm install -g pnpm@${PNPM_VERSION} --registry=${NPM_REGISTRY_FALLBACK})

# Copy package files first for better layer caching
COPY api/package*.json ./
COPY api/.npmrc ./
COPY api/pnpm-lock.yaml* ./

# Нативные зависимости (argon2) требуют сборки в Alpine/musl
RUN apk add --no-cache --virtual .build-deps python3 build-base

# Install dependencies with increased timeouts and retries
RUN --mount=type=cache,target=/root/.pnpm-store \
    --mount=type=cache,target=/app/node_modules/.cache \
    pnpm config set registry ${NPM_REGISTRY} \
    && pnpm config set fetch-retries 5 \
    && pnpm config set fetch-retry-factor 3 \
    && pnpm config set fetch-retry-maxtimeout 180000 \
    && pnpm config set fetch-timeout 180000 \
    && pnpm config set network-timeout 180000 \
    && (pnpm install --frozen-lockfile --dangerously-allow-all-builds || ( \
        echo "First install failed, retrying with delay..." \
        && sleep 10 \
        && pnpm install --frozen-lockfile --dangerously-allow-all-builds \
    ) || ( \
        echo "Second attempt failed, trying fallback registry..." \
        && pnpm config set registry ${NPM_REGISTRY_FALLBACK} \
        && pnpm install --frozen-lockfile --dangerously-allow-all-builds \
    ))

RUN apk del .build-deps

# Copy source code after dependencies are installed
COPY api/ ./

RUN rm -f .env

# Ensure Prisma 7 in node_modules (CI cache may have served 6.x)
RUN pnpm add -D prisma@7

# Generate Prisma Client and build (retry on transient network errors in CI)
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN for i in 1 2 3; do \
      pnpm run prisma:generate && break; \
      echo "prisma generate attempt $$i failed, retrying in 15s..."; \
      sleep 15; \
    done \
    && pnpm run build \
    && test -f /app/dist/main.js || (echo "Build failed: main.js not found" && ls -laR /app/dist && exit 1)

# Production stage
FROM node:22-alpine

WORKDIR /app

ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/vk_api?schema=public
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_ENV=production

RUN npm config set registry https://registry.npmmirror.com \
    && npm config set fetch-retries 5 \
    && npm config set fetch-timeout 180000 \
    && (npm install -g prisma@7 || ( \
        echo "Retrying with delay..." \
        && sleep 10 \
        && npm install -g prisma@7 \
    ) || ( \
        npm config set registry https://registry.npmjs.org/ \
        && npm install -g prisma@7 \
    )) \
    && apk add --no-cache netcat-openbsd

COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/node_modules ./node_modules

# Копируем entrypoint и healthcheck
COPY docker/backend-entrypoint.sh /app/entrypoint.sh
COPY docker/backend-healthcheck.cjs /app/healthcheck.cjs
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=120s \
  CMD ["node", "/app/healthcheck.cjs"]
