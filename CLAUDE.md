# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**parseVK** is a VK (VKontakte) analytics application for parsing and analyzing VK group comments. The system consists of multiple services:

**Core Services:**

- **API** (Backend): NestJS application that interfaces with VK API and manages parsing tasks
- **Frontend**: React/Vite application with Zustand state management
- **Database**: PostgreSQL 15 with Prisma ORM
- **Redis**: In-memory data store for caching and background job management

**Infrastructure Services:**

- **DB Backup**: Automated PostgreSQL backup service (daily at 3 AM, 7-day retention)
- **Prometheus**: Metrics collection and monitoring
- **Grafana**: Metrics visualization and dashboards
- **Node Exporter**: System-level metrics collection

The application allows users to create parsing tasks to collect posts and comments from VK groups, track authors, search for keywords in comments, and monitor specific authors' activity through the "Watchlist" (На карандаше) feature.

## Code Quality Standards

### TypeScript Best Practices

- Always use TypeScript with strict mode enabled
- Avoid `any`, use `unknown` when type is truly unknown
- Type all functions, parameters, and return values explicitly
- Use `interface` for object shapes, `type` for unions/intersections/aliases

```typescript
// ✅ GOOD
interface User {
  id: string;
  name: string;
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// ❌ BAD
function getUser(id: any): any {
  // ...
}
```

### SOLID Principles

- **Single Responsibility**: One class/function should have one responsibility
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Many specific interfaces are better than one general
- **Dependency Inversion**: Depend on abstractions, not concrete implementations

### Code Readability

- Write self-documenting, readable code
- Use meaningful variable names (avoid abbreviations unless widely known)
- Avoid magic numbers - use named constants
- Keep functions short (< 20 lines ideally)
- Use early returns to simplify logic

```typescript
// ✅ GOOD
const MAX_RETRY_ATTEMPTS = 3;

function processPayment(amount: number): void {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }
  // process payment
}

// ❌ BAD
function processPayment(a: number): void {
  if (a > 0) {
    // deeply nested logic
  }
}
```

### Comments

- Add comments only for complex logic that isn't self-evident
- Explain "why", not "what"
- Keep comments up to date with code changes
- Use JSDoc for public APIs and exported functions

```typescript
// ✅ GOOD
// Using O(1) lookup instead of O(n) search for large datasets
const cache = new Map();

/**
 * Creates a parsing task with group validation
 * @param dto - Task creation data
 * @returns Created task instance
 */
async function createTask(dto: CreateTaskDto): Promise<Task> {
  // ...
}
```

## Development Commands

### Docker (Primary deployment method)

```bash
# Build and start all services
docker-compose up --build

# Start services without rebuilding
docker-compose up

# Stop all services (preserves data in volumes)
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

**Docker Volumes:**

The application uses named Docker volumes for data persistence:

- `parsevk_postgres_data` (external) - PostgreSQL database data
- `parsevk_postgres_backups` - Database backup files
- `parsevk_prometheus_data` - Prometheus metrics data
- `parsevk_grafana_data` - Grafana dashboards and settings

**IMPORTANT**: The `parsevk_postgres_data` volume is marked as external and must be created before first run:

```bash
docker volume create parsevk_postgres_data
```

All volumes persist data between container restarts. Use `docker-compose down -v` only when you want to completely reset the application state.

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

**IMPORTANT**: For verifying changes, use `npm run build` instead of `npm run dev`. This ensures:

- All TypeScript errors are caught at compile time
- Build-time optimizations are tested
- Production bundle issues are identified early
- Vite build plugins and transformations are validated

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

**Backend Best Practices:**

NestJS architecture follows these principles:

```typescript
// ✅ GOOD - Proper separation of concerns
@Module({
  controllers: [TasksController],
  providers: [TasksService, TasksRepository],
})
export class TasksModule {}

@Controller("tasks")
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Post()
  async create(@Body() dto: CreateTaskDto) {
    return this.service.create(dto); // Controller only routes
  }
}

// Service contains business logic
@Injectable()
export class TasksService {
  async create(dto: CreateTaskDto): Promise<Task> {
    // Business logic here
  }
}
```

**Validation:**

- Always validate input data using class-validator
- Use DTOs for request/response typing
- Validation happens at controller level

```typescript
export class CreateTaskDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

**Error Handling:**

- Use NestJS exception filters for error handling
- Create custom exceptions for business logic errors
- Always log errors with context
- Never expose sensitive data in error messages

**Logging:**

- Log important events (creation, updates, errors)
- Use appropriate log levels (debug, info, warn, error)
- Never log sensitive data (passwords, tokens, personal info)

```typescript
// ✅ GOOD
this.logger.log(`Task ${taskId} created`, { taskId, userId });
this.logger.error("Failed to process task", { error: error.message, taskId });

// ❌ BAD
this.logger.log(`User password: ${password}`);
```

**Testing Strategy:**

The API uses Vitest for both unit and e2e tests:

```typescript
// Unit test example - testing business logic
describe("TasksService", () => {
  let service: TasksService;

  beforeEach(() => {
    // Mock dependencies
    const mockPrisma = createMockPrisma();
    service = new TasksService(mockPrisma);
  });

  it("should create task with valid groups", async () => {
    const dto = { scope: "selected", groupIds: [1, 2] };
    const task = await service.createParsingTask(dto);
    expect(task.status).toBe("pending");
  });
});

// E2E test example - testing API endpoints
describe("Tasks API (e2e)", () => {
  it("/tasks (POST) should create new task", () => {
    return request(app.getHttpServer())
      .post("/tasks")
      .send({ scope: "all" })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty("id");
      });
  });
});
```

**Test Guidelines:**

- Write unit tests for business logic in services
- Mock external dependencies (Prisma, VK API, Redis)
- Use e2e tests for critical API workflows
- Test error cases and edge conditions
- Maintain test coverage for new features

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

**Import Rules:**

All imports must use the `@/` alias for consistency and maintainability:

```typescript
// ✅ CORRECT - Using @/ alias
import { Button } from "@/components/ui/button";
import { useTableSorting } from "@/hooks/useTableSorting";
import { tasksService } from "@/services/tasksService";
import type { Task } from "@/types";
import { useTaskDetails } from "@/modules/tasks/hooks/useTaskDetails";

// ❌ INCORRECT - Relative imports
import { Button } from "../../../components/ui/button";
import { useTaskDetails } from "../hooks/useTaskDetails";
```

**Benefits of using `@/` alias:**

- Consistency across the entire codebase
- Easier refactoring (moving files doesn't break imports)
- Better readability (explicit path to module)
- Simpler to search for dependencies project-wide

**This applies to all imports**, including:

- Inter-module imports within the same module
- Cross-module imports
- Shared component/hook/utility imports

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

**Performance Best Practices:**

React components should follow performance optimization patterns:

```typescript
// ✅ GOOD - Memoized callbacks and computed values
function TaskCard({ task, onComplete }: Props) {
  const handleComplete = useCallback(() => {
    onComplete(task.id)
  }, [task.id, onComplete])

  const isOverdue = useMemo(() => {
    return task.dueDate < new Date()
  }, [task.dueDate])

  return <div onClick={handleComplete}>...</div>
}

// ❌ BAD - Inline functions and re-computation on every render
function TaskCard({ task, onComplete }: Props) {
  return (
    <div onClick={() => onComplete(task.id)}>
      {task.dueDate < new Date() ? 'Overdue' : 'On time'}
    </div>
  )
}
```

**Key performance rules:**

- Avoid inline functions in props (use `useCallback`)
- Memoize expensive computations (use `useMemo`)
- Memoize functions passed as props to prevent child re-renders
- Use `React.memo` for components that render often with same props
- Keep component render logic lightweight

**Accessibility Requirements:**

All UI components must follow WCAG 2.1 accessibility guidelines:

```typescript
// ✅ GOOD - Accessible button with keyboard support
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
  aria-label="Close dialog"
  tabIndex={0}
>
  Close
</button>

// ✅ GOOD - Semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/tasks">Tasks</a></li>
  </ul>
</nav>
```

**Accessibility checklist:**

- Use semantic HTML elements (`<nav>`, `<main>`, `<button>`, etc.)
- Add ARIA attributes where necessary
- Ensure keyboard navigation works (Tab, Enter, Space, Escape)
- Provide meaningful labels for interactive elements
- Maintain sufficient color contrast ratios
- Test with screen readers when implementing complex interactions

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

### Monitoring and Observability

The application includes comprehensive monitoring infrastructure:

**Prometheus**:

- Metrics collection and storage
- Scrapes API endpoints for application metrics
- Configurable retention period
- Configuration: `monitoring/prometheus.yml`

**Grafana**:

- Visualization dashboards for metrics
- Credentials configured via environment variables (see docker-compose.yml)
- Pre-configured data sources and dashboards
- Dashboards location: `monitoring/grafana/dashboards/`

**Node Exporter**:

- System-level metrics (CPU, memory, disk, network)
- Collects host machine statistics

**Access ports configured in docker-compose.yml**

**Key Metrics to Monitor:**

- Task processing rate and duration
- VK API request rates and errors
- Database connection pool status
- Redis cache hit/miss ratios
- Background job queue lengths (watchlist monitoring)
- API response times and error rates

## Environment Variables

**API:**

- `DATABASE_URL` - PostgreSQL connection string (required)
- `VK_TOKEN` - VK API access token (required)
- `PORT` - API server port
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated, optional)
- `MONITOR_DATABASE_URL` - Separate database for monitoring data (optional)

**Redis:**

- Redis connection configured in docker-compose.yml
- Port and authentication settings per environment

**Frontend:**

- `VITE_APP_TITLE` - Application title
- `VITE_API_URL` - API base URL
- `VITE_API_WS_URL` - WebSocket URL
- `VITE_DEV_MODE` - Development mode flag
- `VITE_APP_VERSION` - Application version

**Build Configuration:**

- `NPM_REGISTRY` - Primary npm registry URL
- `NPM_REGISTRY_FALLBACK` - Fallback npm registry URL

These are used in Docker builds to optimize dependency installation in restricted networks.

**IMPORTANT**: All sensitive values (tokens, passwords, connection strings) must be set via environment variables or docker-compose.yml and should NEVER be committed to git.

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

## Database Management

### Migrations

When modifying the Prisma schema:

1. Edit `api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <migration_name>` in api directory
3. Prisma client auto-generated after migration
4. Docker builds include migration execution

### Automated Backups

The `db_backup` service automatically backs up the PostgreSQL database:

**Configuration:**

- Schedule: Configurable via cron expression
- Retention: Configurable retention period
- Location: Docker volume `parsevk_postgres_backups`
- Format: SQL dump files with timestamps

**Manual Backup:**

```bash
# Create manual backup
docker exec <backup_container_name> /backup.sh

# List backups
docker exec <backup_container_name> ls -lh /backups

# Restore from backup (adjust connection parameters as needed)
docker exec -i <db_container_name> psql -U <user> -d <database> < backup_file.sql
```

**Backup Environment Variables:**

- `POSTGRES_HOST`: Database host
- `POSTGRES_PORT`: Database port
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `PGPASSWORD`: Database password
- `BACKUP_DIR`: Backup directory path
- `BACKUP_KEEP_DAYS`: Retention period in days
- `BACKUP_SCHEDULE`: Cron schedule expression

**See docker-compose.yml for actual configuration values.**

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
- Monitor Prometheus metrics for performance issues
- Check Grafana dashboards for system-level problems
