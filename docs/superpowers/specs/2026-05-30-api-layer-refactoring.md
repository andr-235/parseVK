# API Layer Refactoring — Design Spec

**Date:** 2026-05-30
**Scope:** `front/src/shared/api/` — refactoring, decoupling, simplification

---

## 1. Problem Statement

The current `shared/api/` layer has the following issues:

1. **Auth coupling** — `createRequest` in `apiUtils.ts` directly imports `useAuthStore` and `refreshAccessToken`, making the API layer inseparable from the auth module.
2. **Flat structure** — All concerns (config, HTTP client, SSE, query keys, query client) live in one flat directory with mixed responsibilities.
3. **Overly complex URL normalization** — `apiConfig.ts` uses fragile checks (`includes('/api/')`) to avoid double-pathing.
4. **Dead code** — `queryKeys.ts` defines only `auth` and `currentUser`, which duplicate keys already in `shared/auth/api/queryKeys.ts`.
5. **Misplaced utilities** — SSE streaming code lives in the API directory but is a general-purpose streaming utility.
6. **No typed errors** — `handleResponse` throws a generic `Error` with no status code or body, making error handling in consumers cumbersome.
7. **`API_URL` is legacy** — Should be deprecated in favor of `GATEWAY_API_URL`.
8. **Insufficient test coverage** — Only one test file for `createRequest`; no tests for `handleResponse`, `buildQueryString`, SSE parsing, or config normalization.

---

## 2. Proposed Architecture

```
shared/api/
├── client/
│   ├── httpClient.ts          # HTTP client factory with typed methods
│   ├── authProvider.ts        # Auth token provider interface + default impl
│   └── errors.ts              # Typed error classes
├── query/
│   ├── queryClient.ts         # QueryClient singleton + persister (unchanged)
│   └── index.ts               # Re-export for convenience
├── config.ts                  # URL configuration (simplified)
├── index.ts                   # Public barrel (explicit exports)
└── __tests__/
    ├── httpClient.test.ts
    └── config.test.ts
```

**What moves out:**
- `sse.ts` → `shared/utils/sse.ts` (pure streaming utility)

**What is removed:**
- `queryKeys.ts` — base keys owned by auth module
- `apiUtils.ts` — split into `httpClient.ts` + `errors.ts`
- `apiConfig.ts` → renamed to `config.ts`
- `queryClient.ts` → moved to `query/queryClient.ts`

---

## 3. Components

### 3.1 HTTP Client (`client/httpClient.ts`)

A factory function that creates a configured API client:

```typescript
interface ApiClient {
  get<T>(path: string, params?: QueryParams): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  put<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body?: unknown): Promise<T>
  delete<T>(path: string): Promise<T>
  // Raw fetch for special cases (file uploads, streaming)
  raw(path: string, options?: RequestInit): Promise<Response>
}

function createApiClient(baseUrl: string, auth?: AuthProvider): ApiClient
```

**Design decisions:**
- No class, just a factory function returning an object literal (simple, no `this` issues)
- `AuthProvider` injected from outside — client doesn't know about auth store
- Token refresh on 401: **single retry**. If retry also returns 401, the second response error is thrown as-is (no infinite loop).
- All methods throw `ApiError` or `NetworkError` on failure
- `buildQueryString` is internal to the client — consumers pass `params` object directly
- `handleResponse` is internal — consumers just get typed responses
- `authSession.ts` uses raw `fetch` with `credentials: 'include'` and will continue to do so (out of scope for this refactor)

### 3.2 Auth Provider (`client/authProvider.ts`)

```typescript
interface AuthProvider {
  getAccessToken: () => string | null
  refreshAccessToken: () => Promise<string | null>
}
```

Default implementation wraps the existing `useAuthStore` and `refreshAccessToken` from auth module. This is the only place in `shared/api/` that imports from auth — a single file with a clear responsibility boundary.

### 3.3 Typed Errors (`client/errors.ts`)

```typescript
class ApiError extends Error {
  readonly status: number
  readonly body: unknown
  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
  }
  get isUnauthorized(): boolean  // 401
  get isForbidden(): boolean     // 403
  get isNotFound(): boolean      // 404
  get isValidationError(): boolean // 422
}

class NetworkError extends Error {
  readonly cause: unknown
  constructor(cause: unknown) {
    super('Network error')
    this.name = 'NetworkError'
    this.cause = cause
  }
}
```

Allows consumers to do:
```typescript
try { ... }
catch (e) {
  if (e instanceof ApiError && e.isUnauthorized) { ... }
}
```

### 3.4 Config (`config.ts`)

Simplified normalization — just strip trailing slash. No fragile auto-append logic.

```typescript
export const GATEWAY_API_URL = normalize(
  (import.meta.env.VITE_GATEWAY_API_URL ?? import.meta.env.VITE_API_URL ?? '').trim() || '/api'
)

/** @deprecated Use GATEWAY_API_URL instead */
export const API_URL = GATEWAY_API_URL
```

### 3.5 Query (`query/`)

`queryClient.ts` stays as-is. The directory structure just gives it a clean home and allows for future query-related additions.

### 3.6 Barrel (`index.ts`)

Explicit named exports instead of `export *`:

```typescript
export { createApiClient } from './client/httpClient'
export { ApiError, NetworkError } from './client/errors'
export { GATEWAY_API_URL, API_URL } from './config'
export { queryClient, getQueryPersister } from './query'
```

No default export. No `export *` to prevent accidental API surface growth.

---

## 4. Migration Plan

### Phase 1: Scaffold (no breaking changes, all new code)

1. Create `client/`, `query/` directories
2. Write `client/errors.ts`
3. Write `client/authProvider.ts`
4. Write `client/httpClient.ts`
5. Move `queryClient.ts` → `query/queryClient.ts`
6. Write `query/index.ts`
7. Simplify `config.ts`
8. Update `index.ts`

### Phase 2: Move SSE

1. Copy `sse.ts` → `shared/utils/sse.ts`
2. Update consumers: `vkFriendsExport.api.ts`, `okFriendsExport.api.ts`, `useExportJobStream.ts`
3. Remove `sse.ts` from `shared/api/`

### Phase 3: Migrate consumers (one by one)

Each API file transitions from:
```typescript
const response = await createRequest(url, { method, body })
return handleResponse<T>(response)
```
To:
```typescript
return apiClient.post<T>(path, body)
```

### Phase 4: Cleanup

1. **First**, update `shared/auth/api/queryKeys.ts` to define `authQueryKeys` without importing from `shared/api/queryKeys` (inline the base keys).
2. **Then**, remove `shared/api/queryKeys.ts` (no remaining consumers).
3. Remove `apiUtils.ts` (all consumers migrated).
4. Remove `apiConfig.ts` (replaced by `config.ts`).
5. Remove old `index.ts` wildcard exports.

### Phase 5: Tests

- `httpClient.test.ts` — test auth injection, retry on 401, error handling
- `config.test.ts` — test URL normalization with various env values
- `sse.test.ts` — already exists in spirit, move to `shared/utils/__tests__/`

---

## 5. Consumer Changes Summary

| File | Change |
|------|--------|
| Page API files (17 files: `authors.api.ts`, `comments.api.ts`, `groups.api.ts`, `listings.api.ts`, `watchlist.api.ts`, `keywords.api.ts`, `tasks.api.ts`, `taskAutomation.api.ts`, `monitoring.api.ts`, `metrics.api.ts`, `telegram.api.ts`, `adminUsers.api.ts`, `telegramDlUpload.api.ts`, `tgmbaseSearch.api.ts`, `vkFriendsExport.api.ts`, `okFriendsExport.api.ts`, `photoAnalysis.api.ts`) | Replace `createRequest + handleResponse` with `apiClient.get/post/...` |
| 4 files using standalone `buildQueryString` (`authors.api.ts`, `groups.api.ts`, `watchlist.api.ts`, `listings.api.ts`) | Remove manual `buildQueryString` calls — `apiClient.get<T>(path, params)` handles query params internally |
| `shared/auth/config/lib/authSession.ts` | No change (direct fetch with credentials, out of scope) |
| `vkFriendsExport.api.ts`, `okFriendsExport.api.ts` | Import SSE from `@/shared/utils` |
| `useExportJobStream.ts` | Import SSE type from `@/shared/utils` |
| `QueryProvider.tsx` | Import path may change slightly but re-exported from barrel |
| 7 stores + 1 hook importing `queryClient` | No import change (still `@/shared/api`) |
| `shared/auth/api/queryKeys.ts` | Rewrite to define `authQueryKeys` without importing from `shared/api/queryKeys` (inline base keys); done BEFORE removing the old file |
| `setupTests.ts` | May need to update `API_URL` / `GATEWAY_API_URL` mocks if the config normalization changes behavior |

---

## 6. Non-Goals (Out of Scope)

- Refactoring auth module itself (stores, hooks, session)
- Changing React Query version or patterns
- Adding request caching layers
- OpenAPI code generation
- SSR / RSC considerations
- Changes to backend API contracts

---

## 7. Risks

- **Regression in auth refresh flow** — the 401 retry logic in `createRequest` is critical. Must test thoroughly.
- **Breaking consumers** — every API file must be migrated. CI build will catch unupdated imports.
- **SSE move breaks dynamic imports** — verify no lazy imports reference `@/shared/api/sse`.
- **`API_URL` deprecation confusion** — adding `@deprecated` JSDoc so linters/IDE catch new usages.
- **Config normalization regression** — the simplified `config.ts` removes the auto-append of `/api` that the old `normalize` did. If a consumer has `VITE_API_URL=http://host:8000` (without `/api`), the old code would produce `http://host:8000/api` but the new code produces `http://host:8000`. Mitigation: set the full URL including path in environment variables, and verify all env configs in CI/staging before deploying.
