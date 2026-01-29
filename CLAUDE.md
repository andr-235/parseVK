# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**parseVK** is a VK (VKontakte) analytics application for parsing and analyzing VK group comments. The system consists of four main services:

- **API** (Backend): NestJS application that interfaces with VK API and manages parsing tasks
- **Frontend**: React/Vite application with Zustand state management
- **Database**: PostgreSQL with Prisma ORM
- **Redis**: In-memory data store for caching and background job management

The application allows users to create parsing tasks to collect posts and comments from VK groups, track authors, search for keywords in comments, and monitor specific authors' activity through the "Watchlist" (На карандаше) feature.

## Development Commands

### Docker (Primary deployment method)

```bash
# Build and start all services
docker-compose up --build

# Start services without rebuilding
docker-compose up

# Stop all services
docker-compose down
```

### API (NestJS Backend)

Зависимости устанавливаются через [Bun](https://bun.sh): `cd api && bun install`.

```bash
cd api

# Development
bun run start:dev          # Start with hot-reload
bun run start:debug       # Start with debugger

# Build and Production
bun run build
bun run start:prod

# Testing (Vitest)
bun run test              # Run unit tests (vitest run)
bun run test:watch        # Run tests in watch mode
bun run test:cov          # Run tests with coverage
bun run test:e2e          # Run e2e tests (vitest e2e config)

# Code Quality
bun run lint              # Run ESLint with auto-fix
bun run format            # Format with Prettier

# Database (Prisma)
bunx prisma migrate dev   # Run migrations in development
bunx prisma migrate deploy # Run migrations in production
bunx prisma generate      # Generate Prisma client (и add-js-extensions при необходимости)
bunx prisma studio        # Open Prisma Studio GUI
```

### Frontend (React/Vite)

```bash
cd front

# Development
npm run dev                # Start dev server on 0.0.0.0

# Build and Production
npm run build              # Build for production
npm run preview            # Preview production build

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format with Prettier
npm run format:check       # Check formatting without changes
```

## Architecture Overview

### Backend Architecture (NestJS)

**Module Structure:**

- `VkModule` - VK API integration via vk-io library
- `GroupsModule` - VK groups management (CRUD, bulk operations)
- `TasksModule` - Parsing task orchestration and progress tracking
- `CommentsModule` - Comments retrieval and filtering
- `KeywordsModule` - Keyword management for comment search
- `WatchlistModule` - Author monitoring system ("На карандаше" feature)

**Key Services:**

- `VkService` ([src/vk/vk.service.ts](api/src/vk/vk.service.ts)) - Wraps vk-io library for VK API calls (groups, posts, comments, users)
- `TasksService` ([src/tasks/tasks.service.ts](api/src/tasks/tasks.service.ts)) - Manages parsing tasks: creates tasks, fetches posts/comments from groups, tracks progress, handles errors (e.g., disabled walls)
- `WatchlistService` ([src/watchlist/watchlist.service.ts](api/src/watchlist/watchlist.service.ts)) - Manages watchlist authors: CRUD operations, periodic monitoring, comment collection
- `WatchlistMonitorService` ([src/watchlist/watchlist.monitor.service.ts](api/src/watchlist/watchlist.monitor.service.ts)) - Background service that runs every 60 seconds to refresh active watchlist authors
- `AuthorActivityService` ([src/common/services/author-activity.service.ts](api/src/common/services/author-activity.service.ts)) - Shared service for saving authors and comments from both tasks and watchlist
- `PrismaService` ([src/prisma.service.ts](api/src/prisma.service.ts)) - Database client initialization

**Task Processing Flow:**

1. User creates parsing task with selected groups or all groups
2. `TasksService.createParsingTask()` validates groups, creates task record with `pending` status
3. For each group: fetch recent posts (configurable limit), fetch all comments recursively, extract and save author information
4. Task progress updated in real-time (`processedItems`, `progress`, `status`)
5. Task completes with `done` status and statistics (groups, posts, comments, authors)
6. Errors change status to `failed` with error message stored in description

**Watchlist Monitoring Flow:**

1. User adds author to watchlist via comment card or by VK user ID
2. `WatchlistService.createAuthor()` fetches author info, creates `WatchlistAuthor` record with `ACTIVE` status
3. `WatchlistMonitorService` runs every 60 seconds, triggers `WatchlistService.refreshActiveAuthors()`
4. Refresh checks poll interval from settings (default: 5 minutes) to throttle actual VK API calls
5. For each active author (up to `maxAuthors` limit): fetch comments from tracked posts, save new comments with `source: WATCHLIST`
6. Update author's `lastCheckedAt`, `lastActivityAt`, `foundCommentsCount` fields
7. If `trackAllComments` is disabled, only update check timestamps without fetching comments

**Database Schema (Prisma):**

- `Task` - Parsing tasks with progress tracking
- `Group` - VK groups with metadata (membersCount, wall status, etc.)
- `Post` - VK posts linked to groups
- `Comment` - VK comments with nested thread support, linked to posts and authors. Has `source` field (TASK | WATCHLIST) and optional `watchlistAuthorId` reference
- `Author` - VK users who wrote comments
- `Keyword` - Keywords for comment filtering
- `WatchlistAuthor` - Authors being monitored, tracks status (ACTIVE | PAUSED | STOPPED), check timestamps, and comment counts
- `WatchlistSettings` - Global watchlist configuration (poll interval, max authors, track all comments flag)

**API Routing:**

- All endpoints prefixed with `/api` (configured in main.ts)
- CORS enabled for frontend integration
- Logging interceptor on all requests

### Frontend Architecture (React/Vite)

**Project Structure:**

The frontend follows a layered architecture pattern with clear separation of concerns:

```
src/
├── pages/              # Route components (entry points for routing)
├── modules/            # Feature modules with domain logic
│   └── {module}/
│       ├── components/ # Module-specific UI components
│       ├── hooks/      # Module-specific hooks
│       ├── config/     # Module configuration (table columns, etc.)
│       ├── types/      # Module-specific types
│       └── utils/      # Module-specific utilities
├── components/         # Shared reusable UI components
│   ├── ui/            # Base UI components (shadcn/ui)
│   └── Sidebar/       # Sidebar component group
├── hooks/              # Shared custom hooks
├── services/           # API clients and business logic
├── store/              # Global state management (Zustand)
├── utils/              # Pure utility functions
├── types/              # Shared TypeScript types and interfaces
│   └── dto/           # Data Transfer Objects for API
└── lib/                # Low-level configuration and setup
    ├── providers/     # React providers (QueryClient, AppSync)
    └── configUtils.ts # Configuration utilities
```

**Dependency Rules:**

- `pages/` → can use: modules, components, hooks, services, store, utils
- `modules/` → can use: components, hooks, services, store, utils
- `components/` → can use: hooks, utils, types
- `services/` → can use: lib, utils, types
- `store/` → can use: services, lib, utils, types
- `hooks/` → can use: store, services, utils, types
- `utils/` → can use: types only
- `types/` → no dependencies (except built-in types)
- `lib/` → can use: types only

**State Management (Zustand):**

- `tasksStore` ([store/tasksStore.ts](front/src/store/tasksStore.ts)) - Task list with normalized state (taskIds, tasksById), task details caching
- `groupsStore` ([store/groupsStore.ts](front/src/store/groupsStore.ts)) - VK groups management
- `commentsStore` ([store/commentsStore.ts](front/src/store/commentsStore.ts)) - Comments data with keyword filtering
- `keywordsStore` ([store/keywordsStore.ts](front/src/store/keywordsStore.ts)) - Keyword management
- `watchlistStore` ([store/watchlistStore.ts](front/src/store/watchlistStore.ts)) - Watchlist authors management, author details with paginated comments, settings
- `themeStore` ([store/themeStore.ts](front/src/store/themeStore.ts)) - Dark/light theme toggle
- `navigationStore` ([store/navigationStore.ts](front/src/store/navigationStore.ts)) - Sidebar navigation state

All stores use Zustand with immer, persist, devtools, and subscribeWithSelector middleware.

**Routing:**

- `/tasks` - Task list and creation
- `/groups` - Group management (add, bulk upload, view)
- `/comments` - Comments view with keyword highlighting
- `/keywords` - Keyword management
- `/watchlist` - Watchlist authors management and activity monitoring

**Key Components:**

- `CreateParseTaskModal` - Modal for creating parsing tasks with group selection
- `ActiveTasksBanner` - Shows active tasks with progress bars
- `Table` - Generic reusable table component
- `Sidebar` - Navigation with icons, badges, search, quick actions

**Styling:**

- Tailwind CSS 4.x with custom design tokens
- Dark mode support via CSS variables
- Theme managed by `themeStore`

### VK API Integration

**Authentication:**

- VK_TOKEN environment variable required (set in docker-compose.yml or .env)
- Token used by vk-io library in VkService

**Key VK API Operations:**

- `groups.getById` - Fetch group metadata
- `wall.get` - Fetch group posts with filters
- `wall.getComments` - Fetch comments with thread support (recursive). Extended version `getAuthorCommentsForPost` used by watchlist to filter by specific author VK ID
- `users.get` - Fetch user/author information (batch fetching supported)

**Error Handling:**

- API Error 15 (Access denied) handled for disabled group walls
- Groups with disabled walls marked and skipped in parsing

## Environment Variables

**API:**

- `DATABASE_URL` - PostgreSQL connection string
- `VK_TOKEN` - VK API access token (required)
- `PORT` - API server port (default: 3000)

**Redis:**

- Redis runs on default port 6379 (configured in docker-compose.yml)
- No authentication required in development environment

**Frontend:**

- `VITE_APP_TITLE` - Application title
- `VITE_API_URL` - API base URL (default: /api)
- `VITE_DEV_MODE` - Development mode flag

## Important Implementation Details

### Comment Source Tracking

- Comments have `source` field with enum values: `TASK` (collected via parsing tasks) or `WATCHLIST` (collected via author monitoring)
- Comments from watchlist have `watchlistAuthorId` reference linking to the monitored author record
- This allows distinguishing between bulk-collected comments and targeted author monitoring

### Task Progress Tracking

- Tasks use normalized state pattern with `taskIds` array and `tasksById` map
- Progress tracked with: `totalItems`, `processedItems`, `progress` (0-1), `status` (pending/running/done/failed)
- Task descriptions stored as JSON with scope, groupIds, postLimit, stats, errors

### Comment Threading

- Comments support nested threads via `threadItems` array
- Recursive processing in both VkService mapping and TasksService saving
- Thread items stored as JSON in database

### Author Management

- Authors deduplicated by VK user ID during task execution
- Batch fetching via VK API users.get
- Upsert pattern to update existing author records

### Keyword Highlighting

- Utility function `highlightKeywords` ([utils/highlightKeywords.tsx](front/src/utils/highlightKeywords.tsx)) wraps matched keywords in spans
- Case-insensitive matching
- Used in Comments table for text display

### Bulk Operations

- Groups support bulk upload via CSV/JSON
- Keywords support bulk add via textarea (one per line)

### Watchlist Feature (Author Monitoring)

- Users can add authors to watchlist from comment cards or by VK user ID
- Background monitoring via `WatchlistMonitorService` runs every 60 seconds
- Poll interval (default 5 min) configured in `WatchlistSettings` to throttle VK API calls
- Three monitoring statuses: ACTIVE (being monitored), PAUSED (temporarily disabled), STOPPED (permanently disabled)
- Tracks up to `maxAuthors` (default 50) active authors per refresh cycle
- Two modes: `trackAllComments: true` fetches new comments; `false` only updates check timestamps
- Monitors posts where author has previously commented (up to 20 most recent posts)
- Deduplicates comments using `ownerId + vkCommentId` composite key
- Updates `lastCheckedAt`, `lastActivityAt`, and `foundCommentsCount` for each author
- Shared `AuthorActivityService` used by both task parsing and watchlist monitoring to avoid code duplication

## Database Migrations

When modifying the Prisma schema:

1. Edit `api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <migration_name>` in api directory
3. Prisma client auto-generated after migration
4. Docker builds include migration execution

## Common Workflows

### Adding a New VK Data Field

1. Update Prisma schema with new field
2. Run migration: `npx prisma migrate dev`
3. Update interface in `api/src/vk/interfaces/`
4. Update mapping in VkService
5. Update save logic in TasksService
6. Add to frontend types in `front/src/types/`
7. Update table columns config if displaying in UI

### Adding a New Page

1. Create page component in `front/src/pages/`
2. Add route in `App.tsx`
3. Add navigation item in `Sidebar.tsx`
4. Create store if needed in `front/src/store/`
5. Create API service in `front/src/services/`
6. Create module in `front/src/modules/` if page has complex logic

### Adding an Author to Watchlist

1. User clicks "Add to Watchlist" button on comment card (provides `commentId`)
2. OR user provides VK user ID directly (provides `authorVkId`)
3. Backend validates comment/author exists
4. If from comment: extract `authorVkId` from comment, link via `sourceCommentId`
5. Check for duplicates using `authorVkId + settingsId` unique constraint
6. Fetch author info from VK API via `AuthorActivityService.saveAuthors()`
7. Create `WatchlistAuthor` record with status ACTIVE
8. Update source comment with `watchlistAuthorId` and `source: WATCHLIST` if applicable
9. Background monitoring automatically picks up new active author on next cycle

### Modifying Watchlist Monitoring Behavior

- Settings stored in `WatchlistSettings` table (singleton record with id=1)
- `pollIntervalMinutes` - how often to actually fetch from VK API (default: 5)
- `maxAuthors` - limit of authors to process per refresh cycle (default: 50)
- `trackAllComments` - if false, only update timestamps without fetching comments
- Update via PATCH `/api/watchlist/settings` endpoint
- Monitor interval is fixed at 60 seconds in `WatchlistMonitorService`

### Debugging Parsing Tasks

- Check task status in Tasks page
- View task details for error messages
- Check API logs for VK API errors
- Use Prisma Studio to inspect database records
- Enable dev mode logging in stores (import.meta.env.DEV checks)
