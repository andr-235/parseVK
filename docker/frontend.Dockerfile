# Build stage
FROM oven/bun:1-alpine AS build

WORKDIR /app

ARG VITE_API_URL
ARG BUILDKIT_INLINE_CACHE=1

ENV VITE_API_URL=${VITE_API_URL}

# Copy package files first for better layer caching
COPY front/package.json ./
COPY front/bun.lock ./

# Install dependencies with BuildKit cache mount
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Copy source code after dependencies are installed
COPY front/ ./

# Формируем production-конфиг, чтобы фронтенд использовал проксируемый API.
RUN cat <<EOF > .env.production
VITE_API_URL=${VITE_API_URL}
EOF

# Build with cache mount for Vite cache
RUN --mount=type=cache,target=/app/node_modules/.vite \
    bun run build

# Production stage
FROM nginx:alpine

RUN addgroup -g 1001 -S appuser && \
    adduser -S -u 1001 -G appuser appuser && \
    chown -R appuser:appuser /var/cache/nginx /var/run /usr/share/nginx/html

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/frontend.nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/frontend-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

USER appuser

ENTRYPOINT ["/docker-entrypoint.sh"]
