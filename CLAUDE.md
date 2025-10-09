# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**parseVK** is a VK (VKontakte) analytics application for parsing and analyzing VK group comments. The system consists of three main services:

- **API** (Backend): NestJS application that interfaces with VK API and manages parsing tasks
- **Frontend**: React/Vite application with Zustand state management
- **Database**: PostgreSQL with Prisma ORM

The application allows users to create parsing tasks to collect posts and comments from VK groups, track authors, and search for keywords in comments.

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
```bash
cd api

# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debugger

# Build and Production
npm run build
npm run start:prod

# Testing
npm test                   # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run e2e tests

# Code Quality
npm run lint               # Run ESLint with auto-fix
npm run format             # Format with Prettier

# Database (Prisma)
npx prisma migrate dev     # Run migrations in development
npx prisma migrate deploy  # Run migrations in production
npx prisma generate        # Generate Prisma client
npx prisma studio          # Open Prisma Studio GUI
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

**Key Services:**
- `VkService` ([src/vk/vk.service.ts](api/src/vk/vk.service.ts)) - Wraps vk-io library for VK API calls (groups, posts, comments, users)
- `TasksService` ([src/tasks/tasks.service.ts](api/src/tasks/tasks.service.ts)) - Manages parsing tasks: creates tasks, fetches posts/comments from groups, tracks progress, handles errors (e.g., disabled walls)
- `PrismaService` ([src/prisma.service.ts](api/src/prisma.service.ts)) - Database client initialization

**Task Processing Flow:**
1. User creates parsing task with selected groups or all groups
2. `TasksService.createParsingTask()` validates groups, creates task record with `pending` status
3. For each group: fetch recent posts (configurable limit), fetch all comments recursively, extract and save author information
4. Task progress updated in real-time (`processedItems`, `progress`, `status`)
5. Task completes with `done` status and statistics (groups, posts, comments, authors)
6. Errors change status to `failed` with error message stored in description

**Database Schema (Prisma):**
- `Task` - Parsing tasks with progress tracking
- `Group` - VK groups with metadata (membersCount, wall status, etc.)
- `Post` - VK posts linked to groups
- `Comment` - VK comments with nested thread support, linked to posts and authors
- `Author` - VK users who wrote comments
- `Keyword` - Keywords for comment filtering

**API Routing:**
- All endpoints prefixed with `/api` (configured in main.ts)
- CORS enabled for frontend integration
- Logging interceptor on all requests

### Frontend Architecture (React/Vite)

**State Management (Zustand):**
- `tasksStore` ([stores/tasksStore.ts](front/src/stores/tasksStore.ts)) - Task list with normalized state (taskIds, tasksById), task details caching
- `groupsStore` ([stores/groupsStore.ts](front/src/stores/groupsStore.ts)) - VK groups management
- `commentsStore` ([stores/commentsStore.ts](front/src/stores/commentsStore.ts)) - Comments data with keyword filtering
- `keywordsStore` ([stores/keywordsStore.ts](front/src/stores/keywordsStore.ts)) - Keyword management
- `themeStore` ([stores/themeStore.ts](front/src/stores/themeStore.ts)) - Dark/light theme toggle
- `navigationStore` ([stores/navigationStore.ts](front/src/stores/navigationStore.ts)) - Sidebar navigation state

All stores use Zustand with immer, persist, devtools, and subscribeWithSelector middleware.

**Routing:**
- `/tasks` - Task list and creation
- `/groups` - Group management (add, bulk upload, view)
- `/comments` - Comments view with keyword highlighting
- `/keywords` - Keyword management

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
- `wall.getComments` - Fetch comments with thread support (recursive)
- `users.get` - Fetch user/author information

**Error Handling:**
- API Error 15 (Access denied) handled for disabled group walls
- Groups with disabled walls marked and skipped in parsing

## Environment Variables

**API:**
- `DATABASE_URL` - PostgreSQL connection string
- `VK_TOKEN` - VK API access token (required)
- `PORT` - API server port (default: 3000)

**Frontend:**
- `VITE_APP_TITLE` - Application title
- `VITE_API_URL` - API base URL (default: /api)
- `VITE_DEV_MODE` - Development mode flag

## Important Implementation Details

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
4. Create store if needed in `front/src/stores/`
5. Create API service in `front/src/api/`

### Debugging Parsing Tasks
- Check task status in Tasks page
- View task details for error messages
- Check API logs for VK API errors
- Use Prisma Studio to inspect database records
- Enable dev mode logging in stores (import.meta.env.DEV checks)
