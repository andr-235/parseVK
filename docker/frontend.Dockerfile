# Build stage
FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_APP_TITLE
ARG VITE_API_URL
ARG VITE_DEV_MODE
ARG VITE_API_WS_URL
ARG NPM_REGISTRY=https://registry.npmjs.org/
ARG NPM_REGISTRY_FALLBACK=https://registry.npmmirror.com
ARG PNPM_VERSION=9.12.1

ENV VITE_APP_TITLE=${VITE_APP_TITLE}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_DEV_MODE=${VITE_DEV_MODE}
ENV VITE_API_WS_URL=${VITE_API_WS_URL}

RUN npm config set registry ${NPM_REGISTRY} \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-timeout 600000 \
    && (npm install -g pnpm@${PNPM_VERSION} --registry=${NPM_REGISTRY} || npm install -g pnpm@${PNPM_VERSION} --registry=${NPM_REGISTRY_FALLBACK})

COPY front/package*.json ./
COPY front/pnpm-lock.yaml ./
COPY front/.npmrc ./

RUN pnpm config set registry ${NPM_REGISTRY} \
    && pnpm config set fetch-retries 5 \
    && pnpm config set fetch-timeout 600000 \
    && pnpm install --frozen-lockfile

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

RUN pnpm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/frontend.nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
