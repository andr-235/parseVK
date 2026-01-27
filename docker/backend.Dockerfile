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
# Prisma engines mirror - используем официальный CDN
ENV PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh
# Настройки для node-gyp (сборка нативных модулей)
ENV NODEJS_ORG_MIRROR=https://nodejs.org/dist/
ENV npm_config_node_gyp_timeout=300000
# Увеличение таймаутов для Prisma
ENV PRISMA_GENERATE_DATAPROXY=false
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

RUN npm config set registry ${NPM_REGISTRY} \
    && npm config set fetch-retries 3 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm config set fetch-timeout 60000 \
    && (npm install -g pnpm@${PNPM_VERSION} --registry=${NPM_REGISTRY} || npm install -g pnpm@${PNPM_VERSION} --registry=${NPM_REGISTRY_FALLBACK})

# Copy package files first for better layer caching
COPY api/package*.json ./
COPY api/.npmrc ./
COPY api/pnpm-lock.yaml* ./

# Устанавливаем build-base и python3 только для сборки bcrypt
RUN apk add --no-cache --virtual .build-deps python3 build-base

# Install dependencies with BuildKit cache mount
RUN --mount=type=cache,target=/root/.pnpm-store \
    --mount=type=cache,target=/app/node_modules/.cache \
    pnpm config set registry ${NPM_REGISTRY} \
    && pnpm config set fetch-retries 3 \
    && pnpm config set fetch-timeout 60000 \
    && (pnpm install --frozen-lockfile || (echo "Fallback to npmjs" && pnpm config set registry ${NPM_REGISTRY_FALLBACK} && pnpm install --frozen-lockfile)) \
    && (pnpm rebuild bcrypt || (echo "pnpm rebuild failed, trying with npm..." && npm rebuild bcrypt) || echo "Warning: bcrypt rebuild failed, using prebuilt binaries")

# Удаляем build-deps после установки зависимостей
RUN apk del .build-deps

# Copy source code after dependencies are installed
COPY api/ ./

RUN rm -f .env

# Generate Prisma Client and build with cache
# Добавляем retry логику для Prisma generate из-за возможных сетевых проблем
RUN --mount=type=cache,target=/app/node_modules/.prisma \
    (pnpm run prisma:generate || \
     (echo "Prisma generate failed, retrying..." && sleep 5 && pnpm run prisma:generate) || \
     (echo "Prisma generate failed again, retrying one more time..." && sleep 10 && pnpm run prisma:generate)) \
    && pnpm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/vk_api?schema=public
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_ENV=production

# Устанавливаем prisma CLI, netcat и зависимости для пересборки bcrypt
RUN npm config set registry https://registry.npmmirror.com \
    && npm config set fetch-retries 3 \
    && npm config set fetch-timeout 60000 \
    && (npm install -g prisma@^6.16.3 || (npm config set registry https://registry.npmjs.org/ && npm install -g prisma@^6.16.3)) \
    && apk add --no-cache netcat-openbsd python3 build-base

# Копируем собранное приложение и node_modules из build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/node_modules ./node_modules

# Пересобираем bcrypt для текущей платформы (production stage)
# Важно: пересборка должна быть успешной, иначе приложение не запустится
RUN npm config set registry https://registry.npmmirror.com \
    && npm config set fetch-retries 3 \
    && npm config set fetch-timeout 60000 \
    && (npm rebuild bcrypt || (npm config set registry https://registry.npmjs.org/ && npm rebuild bcrypt)) \
    && apk del build-base python3 \
    && node -e "require('bcrypt')" || (echo "ERROR: bcrypt module verification failed" && exit 1)

# Копируем entrypoint скрипт
COPY docker/backend-entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=60s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
