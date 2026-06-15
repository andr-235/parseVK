# API Layer Refactoring — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `front/src/shared/api/` — decouple auth from HTTP client, introduce typed errors, simplify config, move SSE to `shared/utils/`, remove dead `queryKeys.ts`.

**Architecture:** Create `client/` (httpClient factory + authProvider + typed errors) and `query/` subdirectories. Migrate 17 API service files from `createRequest+handleResponse` to `apiClient.get/post/...`. SSE moves to `shared/utils/`.

**Tech Stack:** TypeScript, fetch, TanStack Query, Vitest

**Spec:** `docs/superpowers/specs/2026-05-30-api-layer-refactoring.md`

---

## Chunk 1: Core scaffold — new files, no breaking changes

### Task 1: Create typed error classes

**Files:**
- Create: `front/src/shared/api/client/errors.ts`

- [ ] **Create `errors.ts`**

```typescript
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  get isUnauthorized(): boolean { return this.status === 401 }
  get isForbidden(): boolean { return this.status === 403 }
  get isNotFound(): boolean { return this.status === 404 }
  get isValidationError(): boolean { return this.status === 422 }
}

export class NetworkError extends Error {
  readonly cause: unknown

  constructor(cause: unknown) {
    super('Network error')
    this.name = 'NetworkError'
    this.cause = cause
  }
}
```

### Task 2: Create auth provider

**Files:**
- Create: `front/src/shared/api/client/authProvider.ts`

- [ ] **Create `authProvider.ts`**

```typescript
import { refreshAccessToken } from '@/shared/auth/config/lib/authSession'
import { useAuthStore } from '@/shared/auth/store/authStore'

export interface AuthProvider {
  getAccessToken: () => string | null
  refreshAccessToken: () => Promise<string | null>
}

export const defaultAuthProvider: AuthProvider = {
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshAccessToken: async () => {
    try {
      const result = await refreshAccessToken()
      return result
    } catch {
      return null
    }
  },
}
```

### Task 3: Create HTTP client factory

**Files:**
- Create: `front/src/shared/api/client/httpClient.ts`

- [ ] **Create `httpClient.ts`**

```typescript
import { ApiError, NetworkError } from './errors'
import type { AuthProvider } from './authProvider'

type QueryParams = Record<string, string | number | boolean | undefined | null>

function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  }
  return searchParams.toString()
}

function tryExtractErrorMessage(payload: string | null): string | null {
  if (!payload) return null
  try {
    const parsed = JSON.parse(payload) as { message?: unknown }
    if (typeof parsed.message === 'string' && parsed.message.trim()) return parsed.message.trim()
    if (Array.isArray(parsed.message)) {
      const first = parsed.message.find((m): m is string => typeof m === 'string' && m.trim().length > 0)
      if (first) return first.trim()
    }
  } catch {
    return payload.trim() || null
  }
  return payload.trim() || null
}

function tryParse(payload: string): unknown {
  try { return JSON.parse(payload) } catch { return payload }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text().catch(() => null)
    const message = tryExtractErrorMessage(body)
    throw new ApiError(message || 'Request failed', response.status, body ? tryParse(body) : null)
  }
  return response.json() as Promise<T>
}

export interface ApiClient {
  get<T>(path: string, params?: QueryParams): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  put<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body?: unknown): Promise<T>
  delete<T>(path: string): Promise<T>
  raw(path: string, options?: RequestInit): Promise<Response>
}

export function createApiClient(baseUrl: string, auth?: AuthProvider): ApiClient {
  const buildUrl = (path: string, params?: QueryParams): string => {
    const url = `${baseUrl}${path}`
    if (!params) return url
    const qs = buildQueryString(params)
    return qs ? `${url}?${qs}` : url
  }

  const request = async <T>(path: string, options: RequestInit = {}, params?: QueryParams): Promise<T> => {
    const url = buildUrl(path, params)
    const headers = new Headers(options.headers as Record<string, string> ?? {})
    const body = options.body
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

    if (!isFormData && body != null && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    if (auth) {
      const token = auth.getAccessToken()
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    let response: Response
    try {
      response = await fetch(url, { ...options, headers })
    } catch (cause) {
      throw new NetworkError(cause)
    }

    if (response.status === 401 && auth) {
      const newToken = await auth.refreshAccessToken()
      if (newToken) {
        const retryHeaders = new Headers(headers)
        retryHeaders.set('Authorization', `Bearer ${newToken}`)
        try {
          const retryResponse = await fetch(url, { ...options, headers: retryHeaders })
          return handleResponse<T>(retryResponse)
        } catch (cause) {
          throw new NetworkError(cause)
        }
      }
    }

    return handleResponse<T>(response)
  }

  return {
    get: <T>(path: string, params?: QueryParams) =>
      request<T>(path, { method: 'GET' }, params),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PATCH', body: body != null ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) =>
      request<T>(path, { method: 'DELETE' }),
    raw: (path: string, options?: RequestInit) => {
      const url = `${baseUrl}${path}`
      return fetch(url, options)
    },
  }
}
```

### Task 4: Simplify config

**Files:**
- Create: `front/src/shared/api/config.ts`
- Delete later: `front/src/shared/api/apiConfig.ts`

- [ ] **Create `config.ts`**

```typescript
const normalize = (value: string): string => {
  if (!value) return '/api'
  return value.replace(/\/+$/, '')
}

export const GATEWAY_API_URL = normalize(
  (import.meta.env.VITE_GATEWAY_API_URL ?? import.meta.env.VITE_API_URL ?? '').trim()
)

/** @deprecated Use GATEWAY_API_URL instead */
export const API_URL = GATEWAY_API_URL
```

### Task 5: Move queryClient to query/ subdir

**Files:**
- Move: `front/src/shared/api/queryClient.ts` → `front/src/shared/api/query/queryClient.ts` (content unchanged)
- Create: `front/src/shared/api/query/index.ts`

- [ ] **Move `queryClient.ts`** — copy `queryClient.ts` to `query/queryClient.ts` (content identical)

- [ ] **Create `query/index.ts`**

```typescript
export { queryClient, getQueryPersister } from './queryClient'
```

### Task 6: Update barrel index.ts

**Files:**
- Modify: `front/src/shared/api/index.ts`

- [ ] **Rewrite `index.ts` with explicit exports + `apiClient` singleton**

```typescript
import { createApiClient } from './client/httpClient'
import { defaultAuthProvider } from './client/authProvider'
import { GATEWAY_API_URL } from './config'

export { createApiClient } from './client/httpClient'
export type { ApiClient } from './client/httpClient'
export { ApiError, NetworkError } from './client/errors'
export { GATEWAY_API_URL, API_URL } from './config'
export { queryClient, getQueryPersister } from './query'

export const apiClient = createApiClient(GATEWAY_API_URL, defaultAuthProvider)
```

### Task 7: Update setupTests.ts mock

**Files:**
- Modify: `front/src/setupTests.ts`

- [ ] **Add `apiClient` and `createApiClient` to the mock**

```typescript
vi.mock('@/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api')>()
  const { QueryClient } = await import('@tanstack/react-query')

  return {
    ...actual,
    API_URL: '/api',
    apiClient: actual.createApiClient('/api'),
    queryClient: new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 1000 * 60 * 10,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
          retry: 1,
        },
        mutations: {
          retry: 1,
        },
      },
    }),
    getQueryPersister: () => null,
  }
})
```

Also add `VITE_GATEWAY_API_URL` to the `import.meta.env` mock:

```typescript
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        DEV: process.env.NODE_ENV !== 'production',
        VITE_API_URL: process.env.VITE_API_URL || '/api',
        VITE_GATEWAY_API_URL: process.env.VITE_GATEWAY_API_URL || undefined,
        VITE_API_WS_URL: process.env.VITE_API_WS_URL || undefined,
      },
    },
  },
  writable: true,
  configurable: true,
})
```

### Task 7b: Verify scaffold

- [ ] **Run `cd front && npx tsc --noEmit`** — verify new files compile, barrel exports resolve
- [ ] **Run `cd front && npm test`** — verify existing tests still pass with new mock setup

---

## Chunk 2: Move SSE to shared/utils/

### Task 8: Move sse.ts

**Files:**
- Copy: `front/src/shared/api/sse.ts` → `front/src/shared/utils/sse.ts`
- Delete later: `front/src/shared/api/sse.ts`

- [ ] **Copy `sse.ts`** to `shared/utils/sse.ts` (content identical)

### Task 9: Update SSE consumers

**Files:**
- Modify: `front/src/pages/vk-friends-export/api/vkFriendsExport.api.ts`
- Modify: `front/src/pages/ok-friends-export/api/okFriendsExport.api.ts`
- Modify: `front/src/shared/hooks/useExportJobStream.ts`

**vkFriendsExport.api.ts changes:**
- Change import: `import type { ExportStreamEvent, StreamHandlers } from '@/shared/utils/sse'`
- Change import: `import { extractFilename, readSseStream } from '@/shared/utils/sse'`
- Remove import from `@/shared/api/sse`

**okFriendsExport.api.ts changes:**
- Same pattern as vkFriendsExport.api.ts

**useExportJobStream.ts changes:**
- Change import: `import type { ExportStreamEvent } from '@/shared/utils/sse'`

### Task 10: Verify and delete old sse.ts

- [ ] **Run build to verify** — `cd front && npm run build` (or `npx tsc --noEmit`)
- [ ] **Delete** `front/src/shared/api/sse.ts`

---

## Chunk 3: Migrate API service files

### Task 11: Migrate shared/auth/api/auth.api.ts

**Files:**
- Modify: `front/src/shared/auth/api/auth.api.ts`

Special case: `auth.api.ts` uses `skipAuth`, `skipRefresh`, `credentials: 'include'`, and `buildCsrfHeaders()` — these per-request options are not supported by `apiClient` typed methods. Use `apiClient.raw()` for these endpoints:

```typescript
import { GATEWAY_API_URL, ApiError } from '@/shared/api'
import { buildCsrfHeaders } from '@/shared/auth/config/lib/authSession'
// Note: import apiClient separately — it's exported from '@/shared/api'

async function handleAuthResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text().catch(() => null)
    throw new ApiError('Auth failed', response.status, body)
  }
  return response.json() as Promise<T>
}

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.raw('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      })
      return await handleAuthResponse<AuthResponse>(response)
    } catch (error) {
      toast.error('Неверные учетные данные')
      throw error
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.raw('/v1/auth/change-password', {
        method: 'POST',
        headers: buildCsrfHeaders(),
        body: JSON.stringify({ oldPassword, newPassword }),
        credentials: 'include',
      })
      return await handleAuthResponse<AuthResponse>(response)
    } catch (error) {
      toast.error('Не удалось сменить пароль')
      throw error
    }
  },

  async logout(): Promise<void> {
    const response = await apiClient.raw('/v1/auth/logout', {
      method: 'POST',
      headers: buildCsrfHeaders(),
      credentials: 'include',
    })
    await handleAuthResponse(response)
  },
}
```

### Task 12: Migrate authors.api.ts

**Files:**
- Modify: `front/src/pages/authors/api/authors.api.ts`

Key changes:
- `fetchAuthors` with query params → `apiClient.get<AuthorsListResponse>('/v1/content/authors', params)` (params replaces buildQueryString)
- `getAuthorDetails` → `apiClient.get<AuthorDetailsResponse>(`/v1/content/authors/${vkUserId}`)`
- `refreshAuthors` → `apiClient.post<RefreshAuthorsResponse>('/v1/content/authors/refresh')`
- `deleteAuthor` → `apiClient.delete(`/v1/content/authors/${vkUserId}`)`
- `verifyAuthor` → `apiClient.patch(`/v1/content/authors/${vkUserId}/verify`)`
- Remove `buildQueryString` import
- Remove `createRequest` import
- Remove `handleResponse` import
- Add import: `import { apiClient } from '@/shared/api'` (or import from barrel)

### Task 13: Migrate comments.api.ts

**Files:**
- Modify: `front/src/pages/comments/api/comments.api.ts`

Same pattern — `createRequest` → `apiClient` typed methods.

### Task 14: Migrate groups.api.ts

**Files:**
- Modify: `front/src/pages/groups/api/groups.api.ts`

Special case: `uploadGroupsFile` uses FormData + `API_URL` (legacy). Use `apiClient.raw()` for this:

```typescript
async uploadGroupsFile(file: File): Promise<{ saved: number; errors: string[] }> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.raw('/groups/upload', {
      method: 'POST',
      body: formData,
    })
    // ... rest unchanged
  }
}
```

Note: `/groups/upload` was using `API_URL` which equals `GATEWAY_API_URL` now (both point to same base). The path stays relative.

### Task 15: Migrate listings.api.ts

**Files:**
- Modify: `front/src/pages/listings/api/listings.api.ts`

Similar to authors — params through `apiClient.get<T>(path, params)`.

### Task 16: Migrate watchlist.api.ts, keywords.api.ts, tasks.api.ts, taskAutomation.api.ts, monitoring.api.ts

**Files:**
- Modify: `front/src/pages/watchlist/api/watchlist.api.ts`
- Modify: `front/src/pages/keywords/api/keywords.api.ts`
- Modify: `front/src/pages/tasks/api/tasks.api.ts`
- Modify: `front/src/pages/settings/api/taskAutomation.api.ts`
- Modify: `front/src/pages/monitoring/api/monitoring.api.ts`

All follow same replacement pattern. Batch these together if possible.

### Task 17: Migrate metrics.api.ts

**Files:**
- Modify: `front/src/pages/metrics/api/metrics.api.ts`

Uses raw text response. Change to `apiClient.raw()`:

```typescript
async fetchMetrics(): Promise<string> {
  const response = await apiClient.raw('/v1/metrics')
  if (!response.ok) {
    throw new Error('Failed to fetch metrics')
  }
  return response.text()
}
```

### Task 18: Migrate telegram.api.ts, adminUsers.api.ts, telegramDlUpload.api.ts, tgmbaseSearch.api.ts, vkFriendsExport.api.ts, okFriendsExport.api.ts, photoAnalysis.api.ts

**Files:**
- Modify: `front/src/pages/telegram/api/telegram.api.ts`
- Modify: `front/src/pages/admin-users/api/adminUsers.api.ts`
- Modify: `front/src/pages/telegram-dl-upload/api/telegramDlUpload.api.ts`
- Modify: `front/src/pages/tgmbase-search/api/tgmbaseSearch.api.ts`
- Modify: `front/src/pages/ok-friends-export/api/okFriendsExport.api.ts`
- Modify: `front/src/pages/author-analysis/api/photoAnalysis.api.ts`

**Special case — VK and OK exports:** Both `vkFriendsExport.api.ts` and `okFriendsExport.api.ts` have `streamJob` and `downloadJobFile` methods that need raw `Response` (not JSON parsing). Use `apiClient.raw()`:

```typescript
// streamJob — SSE streaming response (auth still injected by raw if apiClient has authProvider)
const response = await apiClient.raw(`/v1/vk/friends/jobs/${jobId}/stream`, { ... })
// same pattern for ok-export

// downloadJobFile — blob download
const response = await apiClient.raw(`/v1/vk/friends/jobs/${jobId}/download/${type}`)
// same pattern for ok-export
```

### Task 19: Verify build

- [ ] **Run `cd front && npx tsc --noEmit`** — fix any type errors
- [ ] **Run `cd front && npm test`** — fix any test failures

---

## Chunk 4: Cleanup

### Task 20: Update and remove queryKeys.ts

**Files:**
- Modify: `front/src/shared/auth/api/queryKeys.ts`
- Delete: `front/src/shared/api/queryKeys.ts`

- [ ] **Rewrite `shared/auth/api/queryKeys.ts`** to inline base keys:

```typescript
export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: ['auth', 'currentUser'] as const,
}
```

- [ ] **Verify no other imports** from `@/shared/api/queryKeys` (grep the codebase)
- [ ] **Delete** `front/src/shared/api/queryKeys.ts`

### Task 21: Delete old files

- [ ] **Delete** `front/src/shared/api/apiUtils.ts` (all consumers migrated)
- [ ] **Delete** `front/src/shared/api/apiConfig.ts` (replaced by config.ts)
- [ ] **Delete** `front/src/shared/api/queryClient.ts` (moved to query/ subdir)

### Task 22: Verify old index.ts doesn't have wildcard exports

- [ ] **Check** `front/src/shared/api/index.ts` has no `export *` — only explicit named exports

---

## Chunk 5: Tests

### Task 23: Write config.test.ts

**Files:**
- Create: `front/src/shared/api/__tests__/config.test.ts`

- [ ] **Create config test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('API config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('defaults to /api when no env is set', async () => {
    vi.stubEnv('VITE_API_URL', '')
    vi.stubEnv('VITE_GATEWAY_API_URL', '')
    const { GATEWAY_API_URL } = await import('../config')
    expect(GATEWAY_API_URL).toBe('/api')
  })

  it('strips trailing slash', async () => {
    vi.stubEnv('VITE_GATEWAY_API_URL', 'http://localhost:8000/api/')
    const { GATEWAY_API_URL } = await import('../config')
    expect(GATEWAY_API_URL).toBe('http://localhost:8000/api')
  })

  it('falls back to VITE_API_URL when GATEWAY is not set', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000/api')
    vi.stubEnv('VITE_GATEWAY_API_URL', '')
    const { GATEWAY_API_URL } = await import('../config')
    expect(GATEWAY_API_URL).toBe('http://localhost:8000/api')
  })

  it('prefers GATEWAY_API_URL over API_URL', async () => {
    vi.stubEnv('VITE_API_URL', 'http://legacy:8000/api')
    vi.stubEnv('VITE_GATEWAY_API_URL', 'http://gateway:8000/api')
    const { GATEWAY_API_URL } = await import('../config')
    expect(GATEWAY_API_URL).toBe('http://gateway:8000/api')
  })

  it('API_URL is deprecated alias for GATEWAY_API_URL', async () => {
    vi.stubEnv('VITE_GATEWAY_API_URL', 'http://gw:8000/api')
    const { API_URL, GATEWAY_API_URL } = await import('../config')
    expect(API_URL).toBe(GATEWAY_API_URL)
  })
})
```

### Task 24: Write httpClient.test.ts

**Files:**
- Create: `front/src/shared/api/__tests__/httpClient.test.ts`

- [ ] **Create HTTP client test** — test auth injection, 401 retry, error handling, query params

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('createApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends GET request with query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), { status: 200 })
    )
    globalThis.fetch = fetchMock

    const { createApiClient } = await import('../client/httpClient')
    const client = createApiClient('http://test.com/api')
    await client.get('/v1/test', { offset: 0, limit: 10 })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://test.com/api/v1/test?offset=0&limit=10',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('injects auth token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    globalThis.fetch = fetchMock

    const { createApiClient } = await import('../client/httpClient')
    const client = createApiClient('http://test.com/api', {
      getAccessToken: () => 'test-token',
      refreshAccessToken: async () => null,
    })
    await client.get('/v1/test')

    const headers = new Headers(fetchMock.mock.calls[0][1].headers)
    expect(headers.get('Authorization')).toBe('Bearer test-token')
  })

  it('retries on 401 after token refresh', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    globalThis.fetch = fetchMock

    const { createApiClient } = await import('../client/httpClient')
    const client = createApiClient('http://test.com/api', {
      getAccessToken: () => 'old-token',
      refreshAccessToken: async () => 'new-token',
    })
    const result = await client.get('/v1/test')

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const retryHeaders = new Headers(fetchMock.mock.calls[1][1].headers)
    expect(retryHeaders.get('Authorization')).toBe('Bearer new-token')
  })

  it('throws ApiError on non-ok response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Not found' }), { status: 404 })
    )
    globalThis.fetch = fetchMock

    const { createApiClient } = await import('../client/httpClient')
    const { ApiError } = await import('../client/errors')
    const client = createApiClient('http://test.com/api')
    await expect(client.get('/v1/test')).rejects.toThrow(ApiError)
  })

  it('throws NetworkError on fetch failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    globalThis.fetch = fetchMock

    const { createApiClient } = await import('../client/httpClient')
    const { NetworkError } = await import('../client/errors')
    const client = createApiClient('http://test.com/api')
    await expect(client.get('/v1/test')).rejects.toThrow(NetworkError)
  })
})
```

### Task 25: Run all tests

- [ ] **Run `cd front && npm test`** — all tests pass
- [ ] **Run `cd front && npx tsc --noEmit`** — no type errors

---

## Verification checklist

- [ ] `npm run build` passes
- [ ] `npm test` passes (or equivalent test runner)
- [ ] No remaining imports from old paths (grep for `from '@/shared/api/apiUtils'`, `from '@/shared/api/apiConfig'`, `from '@/shared/api/queryKeys'`, `from '@/shared/api/sse'`)
- [ ] `setupTests.ts` mock covers all exported bindings
- [ ] All 18 API files migrated to `apiClient` (auth.api.ts + 17 page API files)
