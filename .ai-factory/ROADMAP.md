# Project Roadmap

> A social media analytics platform for monitoring and detecting illegal/extremist content across VK, Telegram, and WhatsApp.

## Milestones

- [x] **Legacy Monolith Migration (FastAPI Rewrite)** — all 9 microservices migrated from Node.js/Prisma to Python FastAPI with Router → Service → Repository pattern
- [x] **Authentication & Authorization** — JWT auth, refresh tokens, user roles, admin user management
- [x] **VK Parsing Pipeline** — full content collection: posts, comments, authors, groups via VK API with Kafka event-driven processing
- [x] **Content Moderation Pipeline** — keyword matching (with morphology), watchlist tracking, photo analysis, comment moderation status
- [x] **Telegram Integration** — Telethon client, tgmbase import/matching/search, Telegram export
- [x] **WhatsApp (IM) Integration** — Wappi.pro client, message ingestion, Kafka consumer
- [x] **Frontend Design System & Core Pages** — 12 of 18 pages working (comments, tasks, groups, authors, watchlist, keywords, telegram, monitoring, auth, admin)
- [ ] **Listings Module (Avito & CSV Export)** — backend exists, frontend is placeholder
- [x] **Friends Export (VK & OK)** — backend exists (XLSX export), frontends implemented
- [ ] **Рефакторинг микросервисов (vk-service к Clean Architecture)** — реструктуризация vk-service на FastAPI к правильной слоистой архитектуре
- [ ] **Monitoring Groups** — frontend page implemented but not connected in router
- [ ] **Metrics & Analytics Dashboard** — placeholder page
- [ ] **Settings Page** — placeholder page
- [ ] **CI/CD & Infrastructure Hardening** — update CI for FastAPI services, remove legacy `api/` directory, clean up Docker Compose
- [ ] **EDA Hardening & Shared Schemas** — shared event schemas in `libs/py/common/`, tasks-service DLQ, persistent consumer retry, DLQ monitoring alerts
- [ ] **Advanced Search (Elasticsearch)** — full-text search across comments, authors, posts

## Completed

| Milestone | Date |
|-----------|------|
| Legacy Monolith Migration (FastAPI Rewrite) | 2026-06-18 |
| Authentication & Authorization | 2026-06-18 |
| VK Parsing Pipeline | 2026-06-18 |
| Content Moderation Pipeline | 2026-06-18 |
| Telegram Integration | 2026-06-18 |
| WhatsApp (IM) Integration | 2026-06-18 |
| Frontend Design System & Core Pages | 2026-06-18 |
| Friends Export (VK & OK) | 2026-06-29 |
