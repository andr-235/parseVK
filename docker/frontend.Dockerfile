# Build stage
FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_APP_TITLE
ARG VITE_API_URL
ARG VITE_DEV_MODE

ENV VITE_APP_TITLE=${VITE_APP_TITLE}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_DEV_MODE=${VITE_DEV_MODE}

COPY front/package*.json ./

RUN npm ci

COPY front/ ./

# Формируем production-конфиг, чтобы фронтенд использовал проксируемый API.
# Это устраняет обращения к домену "http://api" из браузера, которые
# заканчиваются ошибкой DNS (ERR_NAME_NOT_RESOLVED) вне docker-сети.
RUN cat <<EOF > .env.production
VITE_APP_TITLE=${VITE_APP_TITLE}
VITE_API_URL=${VITE_API_URL}
VITE_DEV_MODE=${VITE_DEV_MODE}
EOF

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/frontend.nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
