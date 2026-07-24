# PR-S3 — Keyset pagination for IM search

## Objective

Replace OFFSET-based pagination with keyset (cursor-based) pagination in simple search. Current EXPLAIN baseline shows deep OFFSET costs the same as the full scan (~7.8s). Keyset pagination eliminates the need to scan and skip rows.

**Note:** This PR does NOT reduce frequent search page 1 latency below ~7.8s. It stabilizes deep page latency so page 20 costs the same as page 1.

## Scope

1. Add cursor-based pagination to:
   - `GET /internal/search/messages` — `cursor` query param (opaque, versioned)
   - `POST /internal/search/messages/search` — `cursor` body field
2. Cursor must match the actual sort order:
   ```sql
   ORDER BY created_at DESC NULLS LAST, id DESC
   ```
3. Cursor format: opaque JSON with version prefix, e.g.:
   ```json
   {"v":1, "createdAtIsNull": false, "createdAt": "2026-07-24T10:00:00Z", "id": 123456}
   ```
   Base64-encoded for transport.
4. Handle `created_at IS NULL` rows correctly (nulls sort last in DESC)
5. Query condition for cursor:
   ```sql
   WHERE (created_at IS NULL AND :cursor_created_at_is_null = false)
      OR (created_at < :cursor_created_at)
      OR (created_at = :cursor_created_at AND id < :cursor_id)
   ORDER BY created_at DESC NULLS LAST, id DESC
   LIMIT :limit
   ```
6. Response includes `pageInfo` with `hasMore` and `nextCursor`
7. Keep OFFSET pagination for backward compatibility (deprecated)
8. Cursor takes precedence when both cursor and page/offset are provided
9. Update `SearchMessagesRequest` schema with `cursor` field
10. Update `SearchResponse` with `pageInfo` (hasMore, nextCursor)
11. Update gateway routes if they proxy cursor
12. **Update frontend**: switch from page/offset to nextCursor-based pagination
13. Tests: first page, next page, no more pages, null created_at, duplicate timestamps, no gaps/duplicates between pages
14. No changes to keyword search (already uses keyset)

## Out of scope

- Removing OFFSET pagination (keep for backward compat)
- Optional COUNT (PR-S2)
- Any index changes
- Reducing frequent search page 1 latency (requires PR-S4 or Track D)

## Acceptance criteria

1. First page (no cursor): returns first N rows + `nextCursor`
2. Next page (with cursor): returns next N rows after cursor, no gaps/duplicates
3. Last page: `hasMore=false`, no `nextCursor`
4. Page 1 and page 20 execute in approximately the same time
5. `created_at IS NULL` rows handled correctly
6. Duplicate `created_at` timestamps handled correctly (tie-break by `id`)
7. OFFSET pagination still works for existing clients
8. Cursor + OFFSET together: cursor takes precedence
9. Frontend uses `nextCursor` instead of page number
10. All existing tests pass