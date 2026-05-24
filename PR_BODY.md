Closes #127

## Audit Summary
A full audit of the `api/` directory legacy NestJS controllers was performed. All legacy routes were successfully mapped to their new equivalents in FastAPI or documented as pending migration.

## Endpoint Status Matrix
Please see the updated `docs/BACKEND_MIGRATION_STATUS.md` for the comprehensive endpoint map. Frontend public paths routing has also been noted.

## Chosen Migration Slice
We selected the `admin/users/*` write/admin operations domain for this migration slice.

## What changed
- Added `AdminUsersGatewayService` to `api-gateway` to securely route requests to `/internal/admin/users`.
- Developed an `admin_router` in `identity-service` handling user creation, listing, deletion, and password reset functionalities.
- Created `docs/MANUAL_SMOKE_CHECKS.md` containing manual HTTP verification steps (replacing removed smoke shell scripts).
- Designed the migration slice beforehand in `docs/design/admin-users-migration.md`.
- Verified VK parsing execution token redaction in logs/outbox.

## What's left
The remaining domains have been grouped into follow-up issues. The NestJS fallback continues to handle operations not explicitly routed by the `api-gateway`.

## Follow-up Issues
The following umbrella issue has been designated (or will be shortly created) to cover remaining domains:
- Migrate remaining backend domains to FastAPI (keywords, watchlist, photo-analysis, telegram, tgmbase, listings, data/import, vk/friends, ok/friends, metrics, monitoring, NestJS fallback removal).

## Test Results
- ✅ Unit/Integration Tests on `identity-service` and `api-gateway`.
- ✅ Secrets scan (diff contains no real API keys, environment files, or `.env`).
- ✅ `docs/MANUAL_SMOKE_CHECKS.md` covers end-to-end token validation in outbox payloads.
