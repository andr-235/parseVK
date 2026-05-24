# FASTAPI-MIG-004 Authors/Groups Parity

Issue: #148

## Endpoint map

| Legacy NestJS endpoint | FastAPI/gateway endpoint | Status |
|---|---|---|
| `GET /authors` | `GET /api/v1/content/authors` | migrated: list, search, verified filter, city empty-state handling, sort, offset pagination |
| `GET /authors/:vkUserId` | `GET /api/v1/content/authors/:vkUserId` | migrated: detail contract from content projection |
| `POST /authors/refresh` | none | follow-up: requires authors saver/VK refresh dependency outside content-service |
| `DELETE /authors/:vkUserId` | none | follow-up: legacy deletes Author plus related comments; content projection is read-model only |
| `PATCH /authors/:vkUserId/verify` | none | follow-up: `verifiedAt` is not projected into content-service yet |
| `GET /groups` | `GET /api/v1/content/groups` | migrated: list, search filter, sort, page pagination |
| `GET /groups/:vkGroupId` | `GET /api/v1/content/groups/:vkGroupId` | migrated: detail contract from content projection |
| `GET /groups/search?query` | `GET /api/v1/content/groups/search?q=` | migrated: read-model search by name, screen name, VK id |
| `POST /groups/save` | none | follow-up: requires VK API write/upsert dependency; remains on NestJS |
| `POST /groups/upload` | none | follow-up: bulk save depends on VK API and throttling behavior; remains on NestJS |
| `DELETE /groups/:id` | none | follow-up: destructive write operation remains on NestJS |
| `DELETE /groups/all` | none | follow-up: destructive write operation remains on NestJS |
| `GET /groups/search/region` | none | follow-up: depends on VK region search implementation; remains on NestJS |

## Notes

- Authors photo-analysis summary enrichment is best-effort. If `CONTENT_PHOTO_ANALYSIS_BASE_URL` is not configured, times out, or returns an error, authors endpoints still return the base read model with `summary: null`.
- The content-service read model currently contains a smaller VK projection than the legacy Prisma model. Missing fields are preserved as nullable legacy keys to keep frontend rendering stable while richer projection work remains a follow-up.
- Frontend read clients now use gateway/FastAPI for authors list/details and groups list. Write/admin operations still call the legacy NestJS API.
