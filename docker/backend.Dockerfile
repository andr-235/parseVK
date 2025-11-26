# Build stage
FROM node:22-alpine AS build

WORKDIR /app

ARG DATABASE_URL
ARG NPM_REGISTRY=https://registry.npmmirror.com/
ENV DATABASE_URL=${DATABASE_URL}
ENV PRISMA_ENGINES_MIRROR=https://cdn.npmmirror.com/binaries/prisma
ENV npm_config_registry=${NPM_REGISTRY}
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY api/package*.json ./

RUN npm config set registry ${NPM_REGISTRY} \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 600000 \
    && npm install --no-audit --legacy-peer-deps

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
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chrome
ENV CHROME_BIN=/usr/bin/chrome

RUN set -eux; \
    apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ttf-freefont; \
    CHROMIUM_BIN="$(command -v chromium-browser || true)"; \
    if [ -z "$CHROMIUM_BIN" ]; then \
      CHROMIUM_BIN="$(command -v chromium || true)"; \
    fi; \
    if [ -z "$CHROMIUM_BIN" ]; then \
      echo "Chromium binary not found after installation" >&2; \
      exit 1; \
    fi; \
    ln -sf "$CHROMIUM_BIN" /usr/bin/chrome; \
    ln -sf "$CHROMIUM_BIN" /usr/bin/google-chrome

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig*.json ./

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["npm", "run", "start:prod"]
