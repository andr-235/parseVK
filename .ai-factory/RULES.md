# Project Rules

> Short, actionable rules and conventions for this project. Loaded automatically by /aif-implement.

## Rules

- Never import service factories or business logic from router modules — routers are HTTP-only layer
- Business logic belongs exclusively in the Service layer, never in Routers or Repositories
- All new GatewayService classes must inherit from BaseGatewayService to reuse forward/claims patterns
- Files must not exceed 150 lines — decompose into smaller modules when exceeded; configs, migrations, and autogen excluded
- All database queries must go through Repository classes
- API routes must use kebab-case format (e.g., /internal/user-profile)
- Never use raw SQL, always use SQLAlchemy ORM or Query Builder
- Log every external API call with request and response context
