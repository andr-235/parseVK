# Admin Users API Migration

**Issue**: #127 (Slice: `admin/users/*`)

## Route Ownership
The old `api/src/users/admin-users.controller.ts` logic will be migrated to `identity-service`. This service already manages users and auth logic. The routes will be exposed under a new prefix: `/internal/admin/users`.

## Service Boundary
- `identity-service` handles all user CRUD and password reset logic natively.
- `api-gateway` routes `/api/v1/admin/users/*` to `identity-service /internal/admin/users/*`.

## Auth/Permission Model
The routes must be protected and restricted to users with the `admin` role. In FastAPI, this will be handled by a dependency that checks the role from the parsed JWT claims.

## Data Model Impact
No schema changes. We will use the existing `User` SQLAlchemy model. 

## Migration/Fallback Behavior
The frontend paths will be updated implicitly when we change `api-gateway` configuration. The old NestJS controller will remain available as a fallback until we explicitly remove the old paths in a follow-up PR.

## Test Plan
Add unit tests in `identity-service/tests/` to verify:
1. Admins can list users and reset passwords.
2. Non-admins receive `403 Forbidden`.
3. Valid payload shape.
