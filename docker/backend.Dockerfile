# Build stage
FROM node:22-alpine AS build

WORKDIR /app

ARG DATABASE_URL
ARG NPM_REGISTRY=https://registry.npmmirror.com/
ENV DATABASE_URL=${DATABASE_URL}
ENV PRISMA_ENGINES_MIRROR=https://cdn.npmmirror.com/binaries/prisma
ENV npm_config_registry=${NPM_REGISTRY}
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY api/package*.json ./
COPY api/.npmrc ./

RUN pnpm config set registry ${NPM_REGISTRY} \
    && pnpm install --no-audit

COPY api/ ./

RUN rm -f .env

RUN pnpm run prisma:generate && pnpm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

ARG NPM_REGISTRY=https://registry.npmmirror.com/
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/vk_api?schema=public
ENV PRISMA_ENGINES_MIRROR=https://cdn.npmmirror.com/binaries/prisma
ENV npm_config_registry=${NPM_REGISTRY}
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=build /app/package*.json ./
COPY --from=build /app/pnpm-lock.yaml ./
COPY --from=build /app/.npmrc ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts

RUN pnpm config set registry ${NPM_REGISTRY} \
    && pnpm install --frozen-lockfile

RUN pnpm exec prisma generate

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["pnpm", "run", "start:prod"]
