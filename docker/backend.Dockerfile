# Build stage
FROM node:22-alpine AS build

WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV PRISMA_ENGINES_MIRROR=https://cdn.npmmirror.com/binaries/prisma

COPY api/package*.json ./

RUN --network=host npm ci --no-audit

COPY api/ ./

RUN rm -f .env

RUN npx prisma generate

RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/vk_api?schema=public
ENV PRISMA_ENGINES_MIRROR=https://cdn.npmmirror.com/binaries/prisma

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
