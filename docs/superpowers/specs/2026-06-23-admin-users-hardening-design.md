# Admin Users Hardening Design

**Issue:** #270  
**Status:** Approved  
**Date:** 2026-06-23

## Goal

Make admin user management production-ready: preserve temporary-password
semantics, enforce administrative invariants, scale list operations, and keep
the frontend maintainable and type-safe.

## Scope

- Persist whether a user must replace a temporary password.
- Return the generated temporary password from both admin password actions.
- Clear the temporary-password flag after a successful password change.
- Validate usernames, passwords, roles, query parameters, and update payloads.
- Provide server-side pagination, search, filtering, and sorting.
- Prevent deletion, deactivation, or demotion of the last active administrator.
- Protect the frontend route from non-admin navigation.
- Split the admin page into focused files not exceeding 150 lines.
- Add backend, gateway, API-client, page, and route-guard regression tests.
- Update the documented API contract.

## Out of Scope

- A separate administration microservice.
- General identity-service architecture migration.
- Bulk user operations or audit-log UI.
- Deployment configuration changes.

## Backend Design

### Persistence

Add `users.is_temporary_password BOOLEAN NOT NULL DEFAULT FALSE` through an
Alembic migration. The SQLAlchemy `User` model exposes the same field.

Admin password reset operations set the field to `true`, update the password
hash and password-change timestamp, and revoke refresh tokens in one database
transaction. A successful user-initiated password change sets it to `false`.

### Contracts

Use strict enums and bounded schemas:

- `UserRole`: `admin | user`.
- Username: trimmed, 3–64 characters, restricted to supported characters.
- Password: 12–128 characters.
- List query: page, page size, search, role, active status, temporary-password
  status, sort field, and sort direction.
- List response: `items`, `page`, `pageSize`, `total`, and `totalPages`.
- Password actions: `{ temporaryPassword: string }`.

The API must reject unsupported roles, malformed UUIDs, invalid sorting fields,
empty updates, and out-of-range pagination values with structured 4xx errors.

### Administrative Invariants

The service prevents operations that would leave no active administrator:

- deleting the last active administrator;
- setting the last active administrator inactive;
- changing the last active administrator to the `user` role.

The repository performs the active-admin count and target-user lock in the same
transaction. Conflicting operations return HTTP 409.

### Query Model

The repository owns filtering, stable sorting, counting, offset, and limit.
Search is case-insensitive against username. Every sort includes `id` as a
deterministic tie-breaker. Page size is capped to prevent oversized responses.

### Observability

Log administrative lifecycle events without usernames, passwords, hashes,
tokens, or request bodies. Events include actor ID, target user ID, operation,
result, request ID, and failure category. Temporary passwords are never logged.

## Gateway Design

The gateway forwards typed list query parameters and request bodies to the
identity-service while preserving status codes and structured errors. Existing
public paths remain backward compatible except that list responses become
paginated; frontend migration ships in the same change.

Admin authorization remains enforced at the gateway. Route dependencies and
service factories stay outside router business logic according to project
layering rules.

## Frontend Design

### Module Structure

`AdminUsersPage.tsx` becomes orchestration-only. Focused files own:

- query/filter/sort state;
- create and edit forms;
- user row actions;
- temporary-password disclosure;
- table states and pagination;
- shared constants and types.

Each non-generated source file remains within the repository's 150-line limit.

### Data Flow

TanStack Query keys contain the actual server query. Search is debounced and
sent to the backend; changing filters resets the page. Mutations invalidate the
single admin-users query prefix. The UI never creates cache entries whose
query function ignores their parameters.

Both password actions display the returned password in a single-use warning
panel. Closing the panel removes it from component state. The password is not
written to storage, URL, logs, telemetry, or clipboard automatically.

### Authorization and States

An admin-only route guard redirects authenticated non-admin users away from
`/admin/users`. Backend authorization remains authoritative.

The page provides explicit loading, error, empty, filtered-empty, mutation
pending, success, and mutation-error states. Header and body cells share the
same responsive visibility classes and the table contains exactly one header
per data column.

## Compatibility

The database migration is additive and safe for existing users because the
default is `false`. Password action response compatibility is preserved for
clients already reading `temporaryPassword`. The paginated list response is a
deliberate public-contract change delivered atomically with the frontend.

## Testing

- Migration/model tests for the temporary-password field.
- Service tests for reset, password change, token revocation, validation, and
  last-active-admin invariants.
- Repository tests for filters, stable sorting, counts, and pagination.
- Identity API tests for schemas and response metadata.
- Gateway tests for authorization, forwarding, and error propagation.
- Frontend API tests for request parameters and response mapping.
- Page tests for both password actions, filters, pagination, errors, and table
  structure.
- Router tests proving non-admin users cannot render the page.

## Acceptance Criteria

- No generated temporary password is discarded.
- Password status reflects persisted backend state.
- No operation can remove the last active administrator.
- Large user collections are paginated and filtered server-side.
- The frontend has no redundant full-list request per search value.
- Relevant backend and frontend checks pass without warnings introduced by
  these tests.
- No source file added or modified for this feature exceeds 150 lines.
