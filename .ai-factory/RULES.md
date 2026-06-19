# Project Rules

> Short, actionable rules and conventions for this project. Loaded automatically by /aif-implement.

## Rules

- Never import service factories or business logic from router modules — routers are HTTP-only layer
- Business logic belongs exclusively in the Service layer, never in Routers or Repositories
- GatewayService classes must NOT depend on `Request` — use `forward_service_request()` from `app.modules._base` directly; `BaseGatewayService` is deprecated for new services
- All inter-service HTTP calls must go through `forward_service_request()` to ensure proper domain exception translation
- Services must catch `ServiceClientHTTPError` and `ServiceClientUnavailableError` only via `forward_service_request()` (auto-translates to `BackendServiceError` / `BackendUnavailableError`)
- Domain exceptions (`GatewayError` subclasses) must be translated to `HTTPException` via `translate_gateway_error()` at the service level, never in routers
- All typed backend clients must inherit from `ServiceClient` (in `app/clients/base.py`) and must have an explicit `service_name` class attribute
- Files must not exceed 150 lines — decompose into smaller modules when exceeded; configs, migrations, and autogen excluded
- All database queries must go through Repository classes
- API routes must use kebab-case format (e.g., /internal/user-profile)
- Never use raw SQL, always use SQLAlchemy ORM or Query Builder
- Log every external API call with request and response context
