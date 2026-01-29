# syntax=docker/dockerfile:1.4
# Build stage
FROM node:22-alpine AS build

WORKDIR /app

ARG DATABASE_URL
ARG NPM_REGISTRY=https://registry.npmmirror.com
ARG NPM_REGISTRY_FALLBACK=https://registry.npmjs.org/
ARG PNPM_VERSION=10.25.0
ARG BUILDKIT_INLINE_CACHE=1

# Переменные окружения для pnpm и prisma
ENV DATABASE_URL=${DATABASE_URL}
ENV npm_config_registry=${NPM_REGISTRY}
ENV PUPPETEER_SKIP_DOWNLOAD=true

# ============ КРИТИЧНО: Правильное зеркало Prisma для России/Китая ============
ENV PRISMA_ENGINES_MIRROR=https://cdn.npmmirror.com/binaries/prisma
# Или альтернативно (может работать лучше):
# ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma

# Настройки для node-gyp
ENV NODEJS_ORG_MIRROR=https://nodejs.org/dist/
ENV npm_config_node_gyp_timeout=300000

# НЕ пропускаем postinstall - engines должны скачаться
ENV PRISMA_GENERATE_DATAPROXY=false

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

# Generate Prisma Client and build
RUN --mount=type=cache,target=/app/node_modules/.prisma \
    pnpm run prisma:generate \
    && pnpm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/vk_api?schema=public
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_ENV=production
# Prisma mirror для production stage тоже
ENV PRISMA_ENGINES_MIRROR=https://cdn.npmmirror.com/binaries/prisma

# Устанавливаем prisma CLI с увеличенными таймаутами
RUN npm config set registry https://registry.npmmirror.com \
    && npm config set fetch-retries 5 \
    && npm config set fetch-timeout 180000 \
    && npm config set network-timeout 180000 \
    && (npm install -g prisma@^6.16.3 || ( \
        echo "Retrying with delay..." \
        && sleep 10 \
        && npm install -g prisma@^6.16.3 \
    ) || ( \
        npm config set registry https://registry.npmjs.org/ \
        && npm install -g prisma@^6.16.3 \
    )) \
    && apk add --no-cache netcat-openbsd

# Копируем собранное приложение и node_modules из build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/node_modules ./node_modules

# Копируем entrypoint скрипт
COPY docker/backend-entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=60s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
