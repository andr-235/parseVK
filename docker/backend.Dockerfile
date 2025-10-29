# Build stage
FROM node:22-alpine AS build

WORKDIR /app

ARG DATABASE_URL
ARG NPM_REGISTRY=https://registry.npmmirror.com/
ENV DATABASE_URL=${DATABASE_URL}
ENV PRISMA_ENGINES_MIRROR=https://cdn.npmmirror.com/binaries/prisma
ENV npm_config_registry=${NPM_REGISTRY}

COPY api/package*.json ./

RUN npm config set registry ${NPM_REGISTRY} \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 600000 \
    && npm ci --no-audit --prefer-offline

COPY api/ ./

RUN rm -f .env

RUN npx prisma generate

RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

ARG NPM_REGISTRY=https://registry.npmmirror.com/
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/vk_api?schema=public
ENV PRISMA_ENGINES_MIRROR=https://cdn.npmmirror.com/binaries/prisma
ENV npm_config_registry=${NPM_REGISTRY}

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
