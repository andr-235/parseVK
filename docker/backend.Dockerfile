# Build stage
FROM node:22-alpine AS build

WORKDIR /app

ARG DATABASE_URL
ARG NPM_REGISTRY=https://registry.npmmirror.com
ARG NPM_REGISTRY_FALLBACK=https://registry.npmjs.org/
ARG PNPM_VERSION=9.12.1
ENV PNPM_FETCH_TIMEOUT=120000
ENV PNPM_FETCH_RETRIES=2
ENV PNPM_FETCH_RETRY_FACTOR=2
ENV PNPM_FETCH_RETRY_MINTIMEOUT=20000
ENV PRISMA_CLI_QUERY_ENGINE_BINARY_HOST=https://registry.npmmirror.com/-/binary/prisma/
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma/
ENV DATABASE_URL=${DATABASE_URL}
ENV npm_config_registry=${NPM_REGISTRY}
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN npm config set registry ${NPM_REGISTRY} \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-timeout 120000 \
    && (npm install -g pnpm@${PNPM_VERSION} --registry=${NPM_REGISTRY} || npm install -g pnpm@${PNPM_VERSION} --registry=${NPM_REGISTRY_FALLBACK})

COPY api/package*.json ./
COPY api/.npmrc ./

RUN pnpm config set registry ${NPM_REGISTRY} \
    && pnpm config set fetch-retries 5 \
    && pnpm config set fetch-timeout 120000 \
    && (pnpm install || (pnpm config set registry ${NPM_REGISTRY_FALLBACK} && pnpm install))

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