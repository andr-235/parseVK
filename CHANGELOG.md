# Changelog

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/).

## [Unreleased]

### Added

- (Нет новых добавлений в текущем цикле)

### Changed

- API: переход с Jest на Vitest для unit и e2e тестов
- API: установка зависимостей через Bun (`bun install`), скрипты через `bun run` / `bunx`
- API: ESM-режим (`"type": "module"`), совместимость с Vitest и NestJS
- Docker: backend healthcheck переведён на ESM (`backend-healthcheck.mjs`)
- CI: code-quality и тесты используют Bun (lint, type-check, format-check, test)

### Fixed

- API: падения Vitest из-за reflect-metadata и совместимости с NestJS (jest-shims, unplugin-swc)
- API: убрана строгая типизация `globalThis.jest` в vitest.setup
- Docker: улучшена генерация Prisma Client в backend Dockerfile и entrypoint (повторы при сетевых ошибках, несколько путей)
- Docker: сборка backend через `npx tsc` вместо pnpm build для единообразной структуры вывода

### Removed

- API: Jest и связанные конфигурации (jest.config и т.п.)

---

## Предыдущие изменения

История до введения CHANGELOG отражена в git: переход на Prisma 7, обновления tsconfig.build, .dockerignore, CI (Dependabot для actions/cache, codeql-action, setup-node) и др.
