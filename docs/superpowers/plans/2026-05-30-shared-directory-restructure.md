# Shared Directory Restructure — Implementation Plan

> **For agentic workers:** Uses subagent-driven-development for parallel task execution.

**Goal:** Move `auth/`, `providers/`, `store/` out of `shared/`, clean up `shared/types/` re-exports.

**Architecture:** Feature-module `auth/` at root, app-level `providers/` and `store/` at root. All path updates use `@/` alias which maps to `src/`.

**Tech Stack:** TypeScript, React, Vitest, Vite

---

## Chunk 1: Move `shared/auth/` → `auth/`

### Task 1.1: Create directory structure and move files

**Files:** Create/move all `shared/auth/*` → `auth/*`

- [ ] **Step 1: Create `auth/` directories**

```bash
mkdir -p auth/api/__tests__
mkdir -p auth/config/lib/__tests__
mkdir -p auth/hooks
mkdir -p auth/store
mkdir -p auth/types
```

- [ ] **Step 2: Move files (git mv)**

```bash
git mv shared/auth/api/auth.api.ts auth/api/
git mv shared/auth/api/__tests__/auth.api.test.ts auth/api/__tests__/
git mv shared/auth/api/queryKeys.ts auth/api/
git mv shared/auth/config/lib/authSession.ts auth/config/lib/
git mv shared/auth/config/lib/__tests__/authSession.test.ts auth/config/lib/__tests__/
git mv shared/auth/config/lib/__tests__/tokenRefreshSchedule.test.ts auth/config/lib/__tests__/
git mv shared/auth/hooks/useAuthSession.ts auth/hooks/
git mv shared/auth/store/authStore.ts auth/store/
git mv shared/auth/store/index.ts auth/store/
git mv shared/auth/types/auth.ts auth/types/
git mv shared/auth/types/index.ts auth/types/
```

### Task 1.2: Update imports outside `auth/`

**Files:** Identified 23 import sites outside `auth/`:

- [ ] **Step 1: Update `shared/api/client/authProvider.ts`**

```typescript
// Change:
import { refreshAccessToken } from '@/shared/auth/config/lib/authSession'
import { useAuthStore } from '@/shared/auth/store/authStore'
// To:
import { refreshAccessToken } from '@/auth/config/lib/authSession'
import { useAuthStore } from '@/auth/store/authStore'
```

- [ ] **Step 2: Update `shared/providers/AppSyncProvider.tsx`**

```typescript
// Change:
import { useAuthStore } from '@/shared/auth/store'
// To:
import { useAuthStore } from '@/auth/store'
```

- [ ] **Step 3: Update `shared/providers/AuthProvider.tsx`**

```typescript
// Change lines 7-8:
import { refreshAccessToken } from '@/shared/auth/config/lib/authSession'
import { useAuthStore } from '@/shared/auth/store'
// To:
import { refreshAccessToken } from '@/auth/config/lib/authSession'
import { useAuthStore } from '@/auth/store'
```

- [ ] **Step 4: Update `shared/types/index.ts`**

```typescript
// Change line 14:
export type { AdminUser, UserRole, CreateUserPayload, TemporaryPasswordResponse } from '@/shared/auth/types/auth'
// To:
export type { AdminUser, UserRole, CreateUserPayload, TemporaryPasswordResponse } from '@/auth/types/auth'
```

- [ ] **Step 5: Update `shared/components/common/Sidebar/Sidebar.tsx`**

```typescript
// Change:
import { useAuthSession } from '@/shared/auth/hooks/useAuthSession'
// To:
import { useAuthSession } from '@/auth/hooks/useAuthSession'
```

- [ ] **Step 6: Update `shared/components/common/Sidebar/SidebarFooter.tsx`**

```typescript
// Change:
import { useAuthSession } from '@/shared/auth/hooks/useAuthSession'
// To:
import { useAuthSession } from '@/auth/hooks/useAuthSession'
```

- [ ] **Step 7: Update `shared/providers/__tests__/AuthProvider.test.tsx`**

```typescript
// Change:
import { useAuthStore } from '@/shared/auth/store'
// To:
import { useAuthStore } from '@/auth/store'
```

- [ ] **Step 8: Update `src/App.tsx`**

```typescript
// Change:
import { useAuthStore } from '@/shared/auth/store'
// To:
import { useAuthStore } from '@/auth/store'
```

- [ ] **Step 9: Update `pages/admin-users/api/adminUsers.api.ts`**

```typescript
// Change:
import type { AdminUser, CreateUserPayload, TemporaryPasswordResponse } from '@/shared/auth/types'
// To:
import type { AdminUser, CreateUserPayload, TemporaryPasswordResponse } from '@/auth/types'
```

- [ ] **Step 10: Update `pages/admin-users/AdminUsersPage.tsx`**

```typescript
// Change:
import type { AdminUser, UserRole } from '@/shared/auth/types'
// To:
import type { AdminUser, UserRole } from '@/auth/types'
```

- [ ] **Step 11: Update `pages/admin-users/hooks/useCurrentUser.ts`**

```typescript
// Change:
import { useAuthStore } from '@/shared/auth/store/authStore'
// To:
import { useAuthStore } from '@/auth/store/authStore'
```

- [ ] **Step 12: Update `pages/change-password/ChangePasswordPage.tsx`**

```typescript
// Change lines 8-9:
import { authService } from '@/shared/auth/api/auth.api'
import { useAuthSession } from '@/shared/auth/hooks/useAuthSession'
// To:
import { authService } from '@/auth/api/auth.api'
import { useAuthSession } from '@/auth/hooks/useAuthSession'
```

- [ ] **Step 13: Update `pages/login/LoginPage.tsx`**

```typescript
// Change lines 8-9:
import { authService } from '@/shared/auth/api/auth.api'
import { useAuthSession } from '@/shared/auth/hooks/useAuthSession'
// To:
import { authService } from '@/auth/api/auth.api'
import { useAuthSession } from '@/auth/hooks/useAuthSession'
```

### Task 1.3: Update imports inside `auth/` (self-references)

- [ ] **Step 1: Update `auth/api/auth.api.ts`**

```typescript
// Change:
import { buildCsrfHeaders } from '@/shared/auth/config/lib/authSession'
import type { AuthResponse } from '@/shared/auth/types'
// To:
import { buildCsrfHeaders } from '@/auth/config/lib/authSession'
import type { AuthResponse } from '@/auth/types'
```

- [ ] **Step 2: Update `auth/store/authStore.ts`**

```typescript
// Change:
import type { AuthUser } from '@/shared/auth/types'
// To:
import type { AuthUser } from '@/auth/types'
```

- [ ] **Step 3: Update `auth/hooks/useAuthSession.ts`**

```typescript
// Change:
import { useAuthStore } from '@/shared/auth/store'
// To:
import { useAuthStore } from '@/auth/store'
```

- [ ] **Step 4: Update `auth/config/lib/authSession.ts`**

```typescript
// Change lines 2-3:
import { useAuthStore } from '@/shared/auth/store'
import type { AuthResponse } from '@/shared/auth/types'
// To:
import { useAuthStore } from '@/auth/store'
import type { AuthResponse } from '@/auth/types'
```

- [ ] **Step 5: Verify with tsc**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 6: Run tests**

Run: `npx vitest run --reporter verbose`
Expected: same 3 pre-existing failures, no new failures

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(auth): move shared/auth to src/auth"
```

## Chunk 2: Move `shared/providers/` → `providers/` + `shared/store/` → `store/`

### Task 2.1: Move providers

- [ ] **Step 1: Create and move**

```bash
git mv shared/providers/AppSyncProvider.tsx providers/
git mv shared/providers/AuthProvider.tsx providers/
git mv shared/providers/QueryProvider.tsx providers/
git mv shared/providers/__tests__ providers/
```

- [ ] **Step 2: Update `src/App.tsx`**

```typescript
// Change:
import AppSyncProvider from '@/shared/providers/AppSyncProvider'
// To:
import AppSyncProvider from '@/providers/AppSyncProvider'
```

- [ ] **Step 3: Update `src/main.tsx`**

```typescript
// Change lines 5-6:
import QueryProvider from '@/shared/providers/QueryProvider'
import { AuthProvider } from '@/shared/providers/AuthProvider'
// To:
import QueryProvider from '@/providers/QueryProvider'
import { AuthProvider } from '@/providers/AuthProvider'
```

### Task 2.2: Move store

- [ ] **Step 1: Move**

```bash
mkdir -p store
git mv shared/store/index.ts store/
git mv shared/store/navigationStore.ts store/
```

- [ ] **Step 2: Check for any `@/shared/store` imports**

No external imports found — `navigationStore` is only used internally through `@/shared/store` → `store/` path maps to same location. No changes needed beyond the move.

- [ ] **Step 3: Verify with tsc**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Run tests**

Run: `npx vitest run --reporter verbose`
Expected: same 3 pre-existing failures, no new failures

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: move shared/providers to src/providers, shared/store to src/store"
```

## Chunk 3: Clean `shared/types/index.ts` re-exports

### Task 3.1: Update barrel and fix consumers

- [ ] **Step 1: Remove re-exports from `shared/types/index.ts`**

Delete lines 9-35 (re-exports from `@/shared/auth/types/auth`, `@/pages/authors/types/authors`, `@/pages/author-analysis/types/photoAnalysis`, `@/pages/watchlist/types/watchlist`).

- [ ] **Step 2: Fix `pages/authors/api/authors.api.ts`**

Change imports from `@/shared/types` to direct page paths:
```typescript
// Instead of importing from '@/shared/types', add:
import type { AuthorCard, AuthorDetails, AuthorListResponse, AuthorSortField, AuthorSortOrder } from '@/pages/authors/types/authors'
import { createEmptyPhotoAnalysisSummary } from '@/pages/author-analysis/types/photoAnalysis'
```

- [ ] **Step 3: Fix `pages/authors/api/authors.api.test.ts`**

Mock `createEmptyPhotoAnalysisSummary` from its source path. Test already has a local mock, no change needed (it defines its own mock).

- [ ] **Step 4: Fix `pages/authors/AuthorsPage.tsx`**

```typescript
// Change:
import type { AuthorCard, AuthorSortField, TableColumn } from '@/shared/types'
// To:
import type { TableColumn } from '@/shared/types'
import type { AuthorCard, AuthorSortField } from '@/pages/authors/types/authors'
```

- [ ] **Step 5: Fix `pages/authors/hooks/useAuthorData.ts`**

```typescript
// Change:
import { createEmptyPhotoAnalysisSummary, type AuthorDetails } from '@/shared/types'
// To:
import type { AuthorDetails } from '@/pages/authors/types/authors'
import { createEmptyPhotoAnalysisSummary } from '@/pages/author-analysis/types/photoAnalysis'
```

- [ ] **Step 6: Fix `pages/author-analysis/AuthorAnalysisPage.tsx`**

```typescript
// Change:
import type { AuthorDetails, PhotoAnalysis, PhotoAnalysisSummary, SuspicionLevel } from '@/shared/types'
// To:
import type { PhotoAnalysisSummary, SuspicionLevel } from '@/shared/types'
import type { AuthorDetails } from '@/pages/authors/types/authors'
import type { PhotoAnalysis } from '@/pages/author-analysis/types/photoAnalysis'
```

- [ ] **Step 7: Fix `pages/author-analysis/api/photoAnalysis.api.ts`**

```typescript
// Change:
import type { AnalyzePhotosOptions, PhotoAnalysisResponse, PhotoAnalysisSummary } from '@/shared/types'
// To:
import type { PhotoAnalysisSummary } from '@/shared/types'
import type { AnalyzePhotosOptions, PhotoAnalysisResponse } from '@/pages/author-analysis/types/photoAnalysis'
```

- [ ] **Step 8: Fix watchlist files that import from `@/shared/types`**

Files: `WatchlistPage.tsx`, `hooks/useAuthorColumns.tsx`, `utils/watchlistUtils.ts`, `utils/__tests__/watchlistUtils.test.ts`, `store/watchlistStore.utils.ts`, `store/watchlistStore.ts`

Each needs to split its imports: keep truly shared types (`TableColumn`, `PhotoAnalysisSummary`, etc.) from `@/shared/types`, import page-specific types from `@/pages/watchlist/types/watchlist`.

```typescript
// Pattern - e.g. watchlistUtils.ts:
// Before:
import type { WatchlistAuthorCard, WatchlistComment, WatchlistSettings } from '@/shared/types'
// After:
import type { WatchlistAuthorCard, WatchlistComment, WatchlistSettings } from '@/pages/watchlist/types/watchlist'
```

- [ ] **Step 9: Fix `watchlist/types/watchlist.ts`**

```typescript
// Change:
import type { PhotoAnalysisSummary } from '@/shared/types'
// To:
import type { PhotoAnalysisSummary } from '@/shared/types'
// (stays the same — PhotoAnalysisSummary IS in shared/types)
```

- [ ] **Step 10: Verify with tsc**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 11: Run tests**

Run: `npx vitest run --reporter verbose`
Expected: same 3 pre-existing failures, no new failures

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(types): remove page-type re-exports from shared/types"
```

## Chunk 4: Final verification

- [ ] **Step 1: Full tsc check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Full test run**

Run: `npx vitest run`
Expected: same 3 pre-existing failures, no regressions

- [ ] **Step 3: Verify directory structure**

```bash
# Expected:
ls src/auth/
#   api/ config/ hooks/ store/ types/
ls src/providers/
#   AppSyncProvider.tsx AuthProvider.tsx QueryProvider.tsx __tests__/
ls src/store/
#   index.ts navigationStore.ts
ls src/shared/
#   api/ components/ hooks/ types/ utils/
#   (no auth/, no providers/, no store/)
```
