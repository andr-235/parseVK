# Implementation Plan: Refactor and Simplify Content Service (Phase 2 - Microservice Split)

Branch: refactor/simplify-content-service
Created: 2026-06-17

## Settings
- Testing: yes
- Logging: verbose
- Docs: yes

## Roadmap Linkage
Milestone: "Рефакторинг и упрощение `content-service`"
Rationale: "Decomposes the monolithic content-service by extracting listings and telegram_tgmbase into their own dedicated microservices, establishing strict domain boundaries."

## Commit Plan
- **Commit 1**: "feat(listings-service): initialize microservice and migrate listings logic"
- **Commit 2**: "feat(infra): add listings-service db, compose service, and update gateway"
- **Commit 3**: "refactor(content-service): remove listings module and database tables"
- **Commit 4**: "feat(telegram-service): initialize postgres database and alembic migrations"
- **Commit 5**: "feat(telegram-service): migrate tgmbase import and match logic"
- **Commit 6**: "feat(infra): update gateway routing for telegram tgmbase endpoints"
- **Commit 7**: "refactor(content-service): remove telegram_tgmbase module and tables"
- **Commit 8**: "test(content-service): verify split integration and clean up codebase"

## Tasks

### Phase 0: Base Refactoring (Completed)
- [x] **Task 0.1: Split monolithic layers**
- [x] **Task 0.2: Implement initial unit tests**

### Phase 1: Router Decomposition (Completed)
- [x] **Task 1: Decompose `router.py`**
- [x] **Task 2: Update sub-router dependency injection**

### Phase 2: Repository Decomposition (Completed)
- [x] **Task 3: Decompose `author_repository.py`**
- [x] **Task 4: Decompose `group_repository.py`**

### Phase 3: Service Decomposition (Completed)
- [x] **Task 5: Decompose `author_service.py`**

### Phase 4: Testing & Verification (Completed)
- [x] **Task 6: Update and run unit tests**
- [x] **Task 7: Final compliance and linting check**

### Phase 5: Extract Listings to `listings-service`

- [x] **Task 8: Initialize `listings-service` codebase**
  - **Subject:** Initialize listings-service project structure
  - **Description:**
    Create `services/listings-service` folder.
    Implement standard FastAPI files: `app/main.py` (with app factory and health endpoints), `app/core/config.py` (using Pydantic settings), `app/db/session.py` (with async SQLAlchemy engine), `pyproject.toml` (copy/customize dependencies from content-service), and a `Dockerfile`.
    Initialize Alembic in `services/listings-service/alembic`.
    
    **Files:**
    - `services/listings-service/`

- [x] **Task 9: Migrate Listings logic and DB models**
  - **Subject:** Copy listings module and define DB schemas
  - **Description:**
    Move all files from `services/content-service/app/modules/listings/` to `services/listings-service/app/modules/listings/`.
    Define `ListingsModel` in `services/listings-service/app/db/models.py` (rename table from `content_listings` to `listings` for clean boundaries).
    Generate initial Alembic migration in `listings-service` to create `listings` table and its indexes.
    
    **Files:**
    - `services/listings-service/app/modules/listings/`
    - `services/listings-service/app/db/models.py`

- [x] **Task 10: Configure Infrastructure and API Gateway**
  - **Subject:** Update docker-compose and route proxying
  - **Description:**
    Add `listings-service` and its Postgres database `listings_db` (port `54327` in dev/compose) to `docker-compose.yml`.
    Update API Gateway `ListingsGatewayService` (`services/api-gateway/app/modules/listings/service.py`) to use `service_name="Listings"` and route requests to `settings.listings_base_url` instead of `settings.content_base_url`.
    
    **Files:**
    - `docker-compose.yml`
    - `services/api-gateway/app/modules/listings/service.py`
    - **Blocked by:** Task 10.1

- [x] **Task 10.1: Add listings_base_url to API Gateway Configuration**
  - **Subject:** Add Listings configuration settings in Gateway
  - **Description:**
    Add `listings_base_url` parameter (defaulting to `http://listings-service:8000`) in the `Settings` class inside `services/api-gateway/app/core/config.py`.
    Update appropriate environment files and examples.
    
    **Files:**
    - `services/api-gateway/app/core/config.py`

- [x] **Task 11: Remove Listings from `content-service`**
  - **Subject:** Delete listings module and drop tables in content-service
  - **Description:**
    Delete `services/content-service/app/modules/listings/` folder.
    Remove `listings_router` references from `services/content-service/app/main.py`.
    Remove `ImMessage` / `content_listings` tables from `content-service` models.
    Create a new Alembic migration in `content-service` to drop `content_listings` table.
    
    **Files:**
    - `services/content-service/app/main.py`
    - `services/content-service/app/db/models.py`

### Phase 6: Initialize `telegram-service` DB and Migrate `tgmbase`

- [x] **Task 12: Initialize database for `telegram-service`**
  - **Subject:** Configure SQLAlchemy, session management, and Alembic in telegram-service
  - **Description:**
    Currently `telegram-service` has no database. Add `SQLAlchemy`, `asyncpg`, and `alembic` to `services/telegram-service/pyproject.toml`.
    Create `app/db/session.py` with async database engine.
    Add DB connection settings to `app/core/config.py`.
    Create `alembic.ini` and initialize migrations folder under `services/telegram-service/alembic`.
    
    **Files:**
    - `services/telegram-service/pyproject.toml`
    - `services/telegram-service/app/db/`
    - `services/telegram-service/app/core/config.py`

- [x] **Task 13: Migrate `telegram_tgmbase` module**
  - **Subject:** Move logic, models, and migrations to telegram-service
  - **Description:**
    Move files from `services/content-service/app/modules/telegram_tgmbase/` to `services/telegram-service/app/modules/telegram_tgmbase/`.
    Move all Telegram import and match database models from `content-service` to `telegram-service/app/db/models.py`.
    Generate the initial Alembic migration in `telegram-service` to create these tables.
    
    **Files:**
    - `services/telegram-service/app/modules/telegram_tgmbase/`
    - `services/telegram-service/app/db/models.py`

- [x] **Task 14: Configure infrastructure & API Gateway for Telegram**
  - **Subject:** Update docker-compose and route proxying for Telegram match/import
  - **Description:**
    Add database `telegram_db` to `docker-compose.yml` for `telegram-service` (port `54328` in dev/compose).
    Update API Gateway `TelegramTgmbaseGatewayService` (`services/api-gateway/app/modules/telegram_tgmbase/service.py`) to use `service_name="Telegram"` and point to `settings.telegram_service_base_url` instead of `settings.content_base_url`.
    
    **Files:**
    - `docker-compose.yml`
    - `services/api-gateway/app/modules/telegram_tgmbase/service.py`

- [x] **Task 15: Remove `telegram_tgmbase` from `content-service`**
  - **Subject:** Delete tgmbase module and drop tables in content-service
  - **Description:**
    Delete `services/content-service/app/modules/telegram_tgmbase/` folder.
    Remove `telegram_tgmbase` references from `services/content-service/app/main.py`.
    Remove Telegram matching tables from `content-service` models.
    Create a new Alembic migration in `content-service` to drop these tables.
    
    **Files:**
    - `services/content-service/app/main.py`
    - `services/content-service/app/db/models.py`

### Phase 7: Verification & Testing

- [x] **Task 16: Verify Listings & Telegram unit tests**
  - **Subject:** Update and run unit tests for migrated services
  - **Description:**
    Migrate existing unit tests for `listings` and `telegram_tgmbase` to their new respective services.
    Run `uv run pytest` inside `services/listings-service/` and `services/telegram-service/` and ensure all tests pass.
    
    **Files:**
    - `services/listings-service/tests/`
    - `services/telegram-service/tests/`
    - **Blocked by:** Task 16.1

- [x] **Task 16.1: Configure test database and environments**
  - **Subject:** Setup test config files and environments in new services
  - **Description:**
    Ensure database configs in tests correctly initialize mock database sessions or test database schemas for `listings-service` and `telegram-service`.
    
    **Files:**
    - `services/listings-service/tests/`
    - `services/telegram-service/tests/`

- [x] **Task 17: End-to-End integration check**
  - **Subject:** Ensure API Gateway and remaining content-service tests pass
  - **Description:**
    Run `uv run pytest` in `services/api-gateway/` and `services/content-service/` to make sure all gateway proxying and core content services operate cleanly without warnings.
    Check style rules using `ruff check` in all 4 services.
    
    **Files:**
    - `services/content-service/`
    - `services/api-gateway/`
