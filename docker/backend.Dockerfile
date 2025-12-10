# Build stage
FROM node:22-alpine AS build

WORKDIR /app

ARG DATABASE_URL
ARG NPM_REGISTRY=https://registry.npmmirror.com
ARG NPM_REGISTRY_FALLBACK=https://registry.npmjs.org/
ARG PNPM_VERSION=10.25.0

# Переменные окружения для pnpm и prisma
ENV DATABASE_URL=${DATABASE_URL}
ENV npm_config_registry=${NPM_REGISTRY}
ENV PUPPETEER_SKIP_DOWNLOAD=true
# Prisma engines mirror - используем официальный CDN
ENV PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh

RUN npm config set registry ${NPM_REGISTRY} \
    && npm config set fetch-retries 3 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm config set fetch-timeout 60000 \
    && (npm install -g pnpm@${PNPM_VERSION} --registry=${NPM_REGISTRY} || npm install -g pnpm@${PNPM_VERSION} --registry=${NPM_REGISTRY_FALLBACK})

COPY api/package*.json ./
COPY api/.npmrc ./

# Устанавливаем зависимости с fallback на npmjs
RUN pnpm config set registry ${NPM_REGISTRY} \
    && pnpm config set fetch-retries 3 \
    && pnpm config set fetch-timeout 60000 \
    && (pnpm install || (echo "Fallback to npmjs" && pnpm config set registry ${NPM_REGISTRY_FALLBACK} && pnpm install))

COPY api/ ./

RUN rm -f .env

RUN pnpm run prisma:generate && pnpm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

ARG PNPM_VERSION=10.25.0
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/vk_api?schema=public
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --from=build /app/package*.json ./
COPY --from=build /app/pnpm-lock.yaml ./
COPY --from=build /app/.npmrc ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts

RUN pnpm install --frozen-lockfile --prod

RUN pnpm exec prisma generate

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["pnpm", "run", "start:prod"]