# PR-S2 — Optional total count in IM search

## Objective

Make exact `COUNT(*)` optional in search responses. Current EXPLAIN baseline shows COUNT costs the same as the full result query (~7.8s for frequent terms). Most UI scenarios don't need an exact total — they use `hasMore` + `nextCursor` for pagination.

**Note:** This PR does NOT reduce frequent search page 1 latency below ~7.8s. It removes the second expensive pass (COUNT), cutting endpoint latency from ~15.6s to ~7.8s for frequent terms.

## Scope

1. Add `includeTotal` parameter (default: `false`) to:
   - `GET /internal/search/messages` — query param
   - `POST /internal/search/messages/search` — body field
2. When `includeTotal=false`:
   - Skip `COUNT(*)` query entirely
   - Return `"total": null, "totalMode": "not_calculated"`
   - Compute `hasMore` via `LIMIT + 1` (fetch one extra row, return `limit` rows)
3. When `includeTotal=true`:
   - Keep existing exact `COUNT(*)` behavior
   - Return `"total": N, "totalMode": "exact"`
4. Update `SearchMessagesRequest` schema with `includeTotal` field
5. Update `SearchResponse` schema with `totalMode` field
6. Update gateway routes if they proxy the field
7. **Check and update frontend**: ensure production requests don't require `total` by default. If frontend uses `total` for pagination or result count display, adapt it to work with `total=null` + `hasMore`.
8. Tests for both modes
9. HTTP before/after benchmark: measure endpoint latency with `includeTotal=false` vs `includeTotal=true`

## Out of scope

- Approximate/estimated COUNT (future enhancement)
- Keyset pagination (PR-S3)
- Any index changes
- Reducing frequent search page 1 latency (requires PR-S4 or Track D)

## Acceptance criteria

1. `includeTotal=false` (default): no `COUNT(*)` in EXPLAIN plan, response has `total: null, totalMode: "not_calculated"`
2. `includeTotal=true`: exact `COUNT(*)` executed, response has `total: N, totalMode: "exact"`
3. `hasMore` correctly computed via `LIMIT + 1` when total is not calculated
4. Backward compatible — existing clients without `includeTotal` get `totalMode: "not_calculated"` (new field, ignored by old clients)
5. Frontend works without total count (no broken pagination, no missing result count)
6. Keyword search unchanged (already returns `totalMode: "not_calculated"`)
7. All existing tests pass