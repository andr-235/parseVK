# syntax=docker/dockerfile:1.4
# Build stage
FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_APP_TITLE
ARG VITE_API_URL
ARG VITE_DEV_MODE
ARG VITE_API_WS_URL
ARG NPM_REGISTRY=https://registry.npmmirror.com
ARG NPM_REGISTRY_FALLBACK=https://registry.npmjs.org/
ARG PNPM_VERSION=10.25.0
ARG BUILDKIT_INLINE_CACHE=1

ENV VITE_APP_TITLE=${VITE_APP_TITLE}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_DEV_MODE=${VITE_DEV_MODE}
ENV VITE_API_WS_URL=${VITE_API_WS_URL}

RUN npm config set registry ${NPM_REGISTRY} \
    && npm config set fetch-retries 3 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm config set fetch-timeout 60000 \
    && (npm install -g pnpm@${PNPM_VERSION} --registry=${NPM_REGISTRY} || npm install -g pnpm@${PNPM_VERSION} --registry=${NPM_REGISTRY_FALLBACK})

# Copy package files first for better layer caching
COPY front/package*.json ./
COPY front/pnpm-lock.yaml ./
COPY front/.npmrc ./

# Install dependencies with BuildKit cache mount
RUN --mount=type=cache,target=/root/.pnpm-store \
    --mount=type=cache,target=/app/node_modules/.cache \
    pnpm config set registry ${NPM_REGISTRY} \
    && pnpm config set fetch-retries 3 \
    && pnpm config set fetch-timeout 60000 \
    && (pnpm install --frozen-lockfile || (echo "Fallback to npmjs" && pnpm config set registry ${NPM_REGISTRY_FALLBACK} && pnpm install --frozen-lockfile))

# Copy source code after dependencies are installed
COPY front/ ./

# Формируем production-конфиг, чтобы фронтенд использовал проксируемый API.
# Это устраняет обращения к домену "http://api" из браузера, которые
# заканчиваются ошибкой DNS (ERR_NAME_NOT_RESOLVED) вне docker-сети.
RUN cat <<EOF > .env.production
VITE_APP_TITLE=${VITE_APP_TITLE}
VITE_API_URL=${VITE_API_URL}
VITE_DEV_MODE=${VITE_DEV_MODE}
VITE_API_WS_URL=${VITE_API_WS_URL}
EOF

# Build with cache mount for Vite cache
RUN --mount=type=cache,target=/app/node_modules/.vite \
    pnpm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/frontend.nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/frontend-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
