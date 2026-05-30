# Shared Directory Restructure

## Problem

`src/shared/` contains code that does not belong in a "shared" layer:
- `auth/` — a full feature module (api, store, types, hooks, config)
- `providers/` — app-level React providers (AuthProvider, QueryProvider, AppSyncProvider)
- `store/` — global navigation store
- `types/` — re-exports types from `pages/*/types/` and `auth/types/`, creating circular dependencies

## Target Structure

```
src/
  auth/                  ← moved from shared/auth
    api/
    config/
    hooks/
    store/
    types/
  providers/             ← moved from shared/providers
  store/                 ← moved from shared/store (navigationStore)
  shared/                ← genuinely shared code only
    api/                 ← stays (HTTP client, config, QueryClient)
    components/          ← stays (common/ + ui/)
    hooks/               ← stays (generic hooks)
    types/               ← stays (api.ts, dto/, common.ts, etc.)
    utils/               ← stays
  pages/                 ← unchanged
```

## Detailed Moves

### 1. `shared/auth/` → `auth/`

| Source | Destination |
|---|---|
| `shared/auth/api/auth.api.ts` | `auth/api/auth.api.ts` |
| `shared/auth/api/__tests__/auth.api.test.ts` | `auth/api/__tests__/auth.api.test.ts` |
| `shared/auth/api/queryKeys.ts` | `auth/api/queryKeys.ts` |
| `shared/auth/config/lib/authSession.ts` | `auth/config/lib/authSession.ts` |
| `shared/auth/config/lib/__tests__/authSession.test.ts` | `auth/config/lib/__tests__/authSession.test.ts` |
| `shared/auth/config/lib/__tests__/tokenRefreshSchedule.test.ts` | `auth/config/lib/__tests__/tokenRefreshSchedule.test.ts` |
| `shared/auth/hooks/useAuthSession.ts` | `auth/hooks/useAuthSession.ts` |
| `shared/auth/store/authStore.ts` | `auth/store/authStore.ts` |
| `shared/auth/store/index.ts` | `auth/store/index.ts` |
| `shared/auth/types/auth.ts` | `auth/types/auth.ts` |
| `shared/auth/types/index.ts` | `auth/types/index.ts` |

### 2. `shared/providers/` → `providers/`

| Source | Destination |
|---|---|
| `shared/providers/AppSyncProvider.tsx` | `providers/AppSyncProvider.tsx` |
| `shared/providers/AuthProvider.tsx` | `providers/AuthProvider.tsx` |
| `shared/providers/QueryProvider.tsx` | `providers/QueryProvider.tsx` |
| `shared/providers/__tests__/AuthProvider.test.tsx` | `providers/__tests__/AuthProvider.test.tsx` |

### 3. `shared/store/` → `store/`

| Source | Destination |
|---|---|
| `shared/store/index.ts` | `store/index.ts` |
| `shared/store/navigationStore.ts` | `store/navigationStore.ts` |

### 4. `shared/types/index.ts` — remove re-exports

Remove lines 9-35 (re-exports from `auth/types/` and `pages/*/types/`):

```typescript
// DELETE these re-exports:
export type { AdminUser, UserRole, ... } from '@/shared/auth/types/auth'
export type { AuthorCard, AuthorDetails, ... } from '@/pages/authors/types/authors'
export type { PhotoAnalysis, ... } from '@/pages/author-analysis/types/photoAnalysis'
export { createEmptyPhotoAnalysisSummary } from '@/pages/author-analysis/types/photoAnalysis'
export type { WatchlistStatus, ... } from '@/pages/watchlist/types/watchlist'
```

## Import Migration

### Path Prefix Changes

| Old Prefix | New Prefix | Files |
|---|---|---|
| `@/shared/auth/` | `@/auth/` | ~23 imports |
| `@/shared/providers/` | `@/providers/` | ~12 imports |
| `@/shared/store/` | `@/store/` | ~4 imports |

### Types Migration

Types previously re-exported through `@/shared/types` must now be imported directly:

| Type | New Import Path |
|---|---|
| `AdminUser`, `UserRole`, `CreateUserPayload`, `TemporaryPasswordResponse` | `@/auth/types/auth` |
| `AuthorCard`, `AuthorDetails`, `AuthorListResponse`, etc. | `@/pages/authors/types/authors` |
| `PhotoAnalysis`, `PhotoAnalysisResponse`, `AnalyzePhotosOptions`, `createEmptyPhotoAnalysisSummary` | `@/pages/author-analysis/types/photoAnalysis` |
| `WatchlistStatus`, `WatchlistAuthorProfile`, etc. | `@/pages/watchlist/types/watchlist` |

## Internal Dependency Updates

### `shared/api/client/authProvider.ts`

This file imports from `shared/auth/`:
```typescript
import { refreshAccessToken } from '@/shared/auth/config/lib/authSession'
import { useAuthStore } from '@/shared/auth/store/authStore'
```
After the move, these become:
```typescript
import { refreshAccessToken } from '@/auth/config/lib/authSession'
import { useAuthStore } from '@/auth/store/authStore'
```

This is acceptable: `shared/api` depends on `auth` (auth provides the auth strategy; api consumes it via the `AuthProvider` interface). No circular dependency.

## Execution Order

1. Move `shared/auth/` → `auth/`, update all imports
2. Move `shared/providers/` → `providers/`, update all imports
3. Move `shared/store/` → `store/`, update all imports
4. Clean `shared/types/index.ts`, update all direct type imports
5. Run `tsc --noEmit` + `vitest run` to verify

Each step = one commit with conventional commit message.

## Out of Scope

- Content changes to any file (only path changes + import path updates)
- Refactoring `shared/api`, `shared/components`, `shared/hooks`, `shared/utils`
- Renaming files or restructuring content within moved modules
- Updating barrel exports within moved modules (they stay as-is)
