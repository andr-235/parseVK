# ParseVK — Social Media Analytics Platform

## Overview

A social media analytics platform for monitoring and detecting illegal/extremist content in posts and comments. Parses VKontakte, Telegram, and WhatsApp (via Wappi.pro). Built as a microservice architecture undergoing migration from a legacy Node.js/Prisma monolith to FastAPI-based services.

## Core Features

- Multi-source content collection (VK API, Telegram/Telethon, WhatsApp/Wappi.pro)
- Content moderation and classification
- Author identity management with deduplication
- Task-based parsing orchestration
- Real-time event-driven processing via Kafka
- Monitoring and observability (Prometheus + Grafana)

## Tech Stack

- **Backend:** Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, Alembic
- **Frontend:** React 19, Vite 8, Tailwind CSS 4, TanStack Query 5, Zustand 5, TypeScript 6
- **Database:** PostgreSQL 16 (8 separate databases per service)
- **Messaging:** Kafka 4.1 (event-driven, 3 topics)
- **Cache:** Redis 7.4
- **Infrastructure:** Docker Compose, Prometheus, Grafana, Node Exporter
- **CI/CD:** GitHub Actions, Semantic Release, Husky

## Architecture Notes

- **Three-tier pattern:** Router → Service → Repository per microservice
- **Shared library:** `libs/py/common/` (models, exceptions, Kafka helpers)
- **API Gateway:** Single entry point routing to backend services
- **Event-driven:** Kafka for async inter-service communication, HTTP for synchronous CQRS
- **9 microservices:** api-gateway, identity-service, tasks-service, vk-service, content-service, moderation-service, telegram-service, listings-service, im-service
- **Design system:** Oklch palette, semantic colors, lucide-react icons

## Architecture

See `.ai-factory/ARCHITECTURE.md` for detailed architecture guidelines (Microservices + Three-Tier pattern).

**Pattern:** Microservices + Three-Tier (Router → Service → Repository)

## Non-Functional Requirements

- **Logging:** Standard `logging` module, per-service loggers
- **Error handling:** Structured HTTPException in routers, error persistence in services
- **Security:** JWT auth, CSRF tokens, internal service tokens, Pydantic validation
- **File size:** Max 100-150 lines per file (configs, migrations, autogen excluded)
