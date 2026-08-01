# Project Roadmap

> A social media analytics platform for monitoring and detecting illegal/extremist content across VK, Telegram, and WhatsApp.

## Milestones

- [x] **Legacy Monolith Migration (FastAPI Rewrite)** — all 9 microservices migrated from Node.js/Prisma to Python FastAPI with Router → Service → Repository pattern
- [x] **Authentication & Authorization** — JWT auth, refresh tokens, user roles, admin user management
- [x] **VK Parsing Pipeline** — full content collection: posts, comments, authors, groups via VK API with Kafka event-driven processing
- [x] **Content Moderation Pipeline** — keyword matching (with morphology), watchlist tracking, photo analysis, comment moderation status
- [x] **Telegram Integration** — Telethon client, tgmbase import/matching/search, Telegram export
- [x] **WhatsApp (IM) Integration** — Wappi.pro client, message ingestion, Kafka consumer
- [x] **Frontend Design System & Core Pages** — 12 of 18 pages working (comments, tasks, groups, authors, watchlist, keywords, telegram, monitoring, auth, admin) ([#237](https://github.com/andr-235/parseVK/issues/237), [#233](https://github.com/andr-235/parseVK/issues/233), [#231](https://github.com/andr-235/parseVK/issues/231), [#214](https://github.com/andr-235/parseVK/issues/214))
- [ ] **Listings Module (Avito & CSV Export)** — backend exists, frontend is placeholder ([#153](https://github.com/andr-235/parseVK/issues/153))
- [x] **Friends Export (VK & OK)** — backend exists (XLSX export), frontends implemented ([#167](https://github.com/andr-235/parseVK/issues/167)–[#172](https://github.com/andr-235/parseVK/issues/172))
- [ ] **Epic #281: Rebuild VK collection and content ingestion architecture** — additive migration of VK pipeline: tasks-service owns monitoring intent/source selection, vk-service owns provider execution, content-service owns canonical content; legacy path behind flags until cutover ([#281](https://github.com/andr-235/parseVK/issues/281))
  - [x] P0 — baseline and scaffolding: `parsevk-contracts` package + contract generation CI ([#282](https://github.com/andr-235/parseVK/issues/282), [PR #305](https://github.com/andr-235/parseVK/pull/305))
  - [ ] P1 — contracts, sources and access: monitoring sources, task sources, access scope schemas, immutable TaskRun snapshots ([#283](https://github.com/andr-235/parseVK/issues/283), [#284](https://github.com/andr-235/parseVK/issues/284))
  - [ ] P2 — VK execution runtime: provider accounts, secrets, scheduler, execution attempts/leases/fencing, source collection coalescing ([#285](https://github.com/andr-235/parseVK/issues/285), [#286](https://github.com/andr-235/parseVK/issues/286), [#287](https://github.com/andr-235/parseVK/issues/287))
  - [ ] P3 — durable ingestion: staging batches, byte-aware Kafka packing, ingestion receipts and durable ACK ([#288](https://github.com/andr-235/parseVK/issues/288), [#289](https://github.com/andr-235/parseVK/issues/289))
  - [ ] P4 — canonical content model: provenance, source hashes, entity revisions, comment threads, attachments ([#290](https://github.com/andr-235/parseVK/issues/290), [#291](https://github.com/andr-235/parseVK/issues/291))
  - [ ] P5 — collection semantics: post sync states, incremental collection, full reconciliation ([#292](https://github.com/andr-235/parseVK/issues/292))
  - [ ] P6 — downstream projections: local access projections, canonical change events, consumer/media/export migration ([#293](https://github.com/andr-235/parseVK/issues/293), [#294](https://github.com/andr-235/parseVK/issues/294))
  - [ ] P7 — cutover and hardening: retention, purge manifests, backup tests, legacy removal ([#295](https://github.com/andr-235/parseVK/issues/295))
- [ ] **Monitoring Groups** — frontend page implemented but not connected in router ([#216](https://github.com/andr-235/parseVK/issues/216))
- [ ] **Metrics & Analytics Dashboard** — placeholder page ([#218](https://github.com/andr-235/parseVK/issues/218))
- [ ] **Settings Page** — placeholder page
- [ ] **CI/CD & Infrastructure Hardening** — update CI for FastAPI services, remove legacy `api/` directory, clean up Docker Compose ([#310](https://github.com/andr-235/parseVK/issues/310), [#313](https://github.com/andr-235/parseVK/issues/313), [#331](https://github.com/andr-235/parseVK/issues/331), [#342](https://github.com/andr-235/parseVK/issues/342), [#343](https://github.com/andr-235/parseVK/issues/343), [#380](https://github.com/andr-235/parseVK/issues/380), [#395](https://github.com/andr-235/parseVK/issues/395))
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
| Epic #281 — P0: parsevk-contracts package + contract generation CI (#282) | 2026-07-31 |
