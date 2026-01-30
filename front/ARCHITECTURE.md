# Архитектура фронтенд-проекта

## Структура проекта

```
src/
├── pages/              # Страницы и роуты (только композиция)
├── components/         # Переиспользуемые UI-компоненты
│   ├── ui/            # Базовые компоненты (shadcn/ui)
│   └── Sidebar/       # Группа компонентов сайдбара
├── modules/            # Логически связанные фичи
│   └── {moduleName}/
│       ├── components/    # Компоненты модуля
│       ├── hooks/         # Хуки модуля
│       ├── config/        # Конфигурация (колонки таблиц и т.п.)
│       ├── types/         # Типы модуля (если специфичны)
│       └── utils/         # Утилиты модуля (если специфичны)
├── hooks/              # Общие кастомные хуки
├── services/           # Работа с API, бизнес-логика
├── store/              # Глобальное состояние (Zustand)
├── utils/              # Общие утилиты и хелперы
├── types/              # Общие типы и интерфейсы
└── lib/                # Низкоуровневые конфиги
```

## Правила зависимостей

### Схема зависимостей

```
pages/
  ↓ может использовать
  modules/, components/, hooks/, store/, utils/, types/

modules/
  ↓ может использовать
  components/, hooks/, services/, store/, utils/, types/

components/
  ↓ может использовать
  hooks/, utils/, types/

services/
  ↓ может использовать
  lib/, utils/, types/

store/
  ↓ может использовать
  services/, utils/, types/

hooks/
  ↓ может использовать
  store/, services/, utils/, types/

utils/
  ↓ может использовать
  types/

lib/
  ↓ может использовать
  types/

types/
  ↓ не зависит ни от чего
```

### Детальные правила

1. **pages/** — только композиция компонентов, минимум логики
   - Импортируют модули, компоненты, хуки
   - Используют store через хуки
   - Не содержат бизнес-логику

2. **modules/** — фичи с собственной логикой
   - Компоненты модуля используют хуки модуля
   - Хуки модуля используют store и services
   - Могут иметь собственные типы и утилиты

3. **components/** — переиспользуемые UI-компоненты
   - Не зависят от store напрямую
   - Получают данные через props
   - Могут использовать общие хуки и utils

4. **services/** — работа с API
   - Только HTTP-запросы и обработка ответов
   - Не содержат UI-логику
   - Могут использовать utils и lib

5. **store/** — глобальное состояние
   - Используют services для загрузки данных
   - Предоставляют API для компонентов
   - Могут использовать utils

6. **hooks/** — общие хуки
   - Могут использовать store, services, utils
   - Не содержат специфичную логику модулей

7. **utils/** — чистые функции
   - Не зависят от других слоев
   - Могут использовать только types

8. **lib/** — конфигурация
   - Настройки клиентов, провайдеров
   - Могут использовать types

9. **types/** — типы и интерфейсы
   - Никаких зависимостей

### Исключения

- Компоненты могут использовать store через кастомные хуки (например, `useTheme` в обертке)
- Модули могут напрямую использовать services для:
  - React Query queryFn (стандартный паттерн)
  - Одноразовых операций (импорт, экспорт, синхронизация), не требующих глобального состояния

## Импорты

### Алиас @/

Все импорты должны использовать алиас `@/` вместо относительных путей:

```typescript
// ✅ Правильно
import { Button } from '@/shared/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { formatDateTime } from '@/modules/comments/utils/formatDateTime'

// ❌ Неправильно
import { Button } from '../../../components/ui/button'
import { formatDateTime } from '../utils/formatDateTime'
```

## Структура модуля

Стандартная структура модуля:

```
modules/{moduleName}/
├── components/    # Компоненты модуля (обязательно)
├── hooks/         # Хуки модуля (обязательно)
├── config/        # Конфигурация (опционально)
├── types/         # Типы модуля (опционально)
├── utils/         # Утилиты модуля (опционально)
└── constants/     # Константы модуля (опционально)
```

### Правила использования подпапок

- **components/** — всегда присутствует, содержит все UI-компоненты модуля
- **hooks/** — всегда присутствует, содержит хуки модуля (query, viewModel, специфичные хуки)
- **config/** — опционально, используется для конфигурации (колонки таблиц, настройки отображения)
- **types/** — опционально, используется для типов, специфичных только для этого модуля
- **utils/** — опционально, используется для утилит, специфичных только для этого модуля
- **constants/** — опционально, используется для констант, специфичных только для этого модуля

**Важно:** Если типы/утилиты/константы используются в нескольких модулях, они должны находиться в общих папках `types/`, `utils/` или на верхнем уровне.

### Примеры

**Модуль с полной структурой:**

```
modules/comments/
├── components/
│   ├── CommentCard.tsx
│   └── CommentsTableCard.tsx
├── hooks/
│   ├── useCommentsQuery.ts
│   └── useCommentsViewModel.ts
├── config/
│   └── commentTableColumns.tsx
├── types/
│   └── commentsTable.ts
└── utils/
    ├── formatDateTime.ts
    └── getAuthorInitials.ts
```

**Модуль с типами:**

```
modules/listings/
├── components/
│   ├── ListingCard.tsx
│   └── ListingsInfinite.tsx
├── hooks/
│   ├── useInfiniteListings.ts
│   └── useListingsViewModel.ts
└── types/
    └── listingsTypes.ts  # ListingsMeta, ListingsFetcherParams
```

**Модуль с константами:**

```
modules/watchlist/
├── components/
│   └── WatchlistHero.tsx
├── hooks/
│   └── useWatchlistViewModel.ts
└── constants/
    └── watchlist.ts
```

**Модуль с минимальной структурой:**

```
modules/telegram/
├── components/
│   ├── TelegramSyncCard.tsx
│   └── TelegramSessionCard.tsx
└── hooks/
    ├── useTelegramSession.ts
    └── useTelegramSync.ts
```

## Разделение логики

### Компоненты

Компоненты должны содержать только UI-логику. Бизнес-логика выносится в хуки:

```typescript
// ✅ Правильно: логика в хуке
function CreateParseTaskModal({ isOpen, groups, ... }: Props) {
  const {
    selectedIds,
    search,
    setSearch,
    filteredGroups,
    handleToggle,
    handleSelectAll,
    handleDeselectAll,
  } = useCreateParseTaskModal(groups, isOpen)

  // только UI-логика
}

// ❌ Неправильно: логика в компоненте
function CreateParseTaskModal({ isOpen, groups, ... }: Props) {
  const [selectedIds, setSelectedIds] = useState(...)
  const [search, setSearch] = useState(...)
  // ... вся логика фильтрации здесь
}
```

### Хуки

Хуки модуля могут использовать:

- Store для получения и обновления состояния
- Services для работы с API (в React Query queryFn или для одноразовых операций)
- Utils для вспомогательных функций

## Работа с API

### React Query

Для работы с API используется React Query. Services используются напрямую в queryFn:

```typescript
// ✅ Правильно: services в queryFn
export const useTasksQuery = () => {
  const query = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: tasksService.fetchTasks, // services используется здесь
    // ...
  })

  useEffect(() => {
    if (query.data) {
      useTasksStore.setState({ tasks: query.data }) // store обновляется здесь
    }
  }, [query.data])

  return query
}
```

### Одноразовые операции

Для одноразовых операций (импорт, экспорт, синхронизация) services могут использоваться напрямую:

```typescript
// ✅ Правильно: одноразовая операция
const handleImport = async () => {
  await listingsService.importFromJson({ file, source })
  onImportComplete()
}
```

## Глобальное состояние

Store используется для:

- Глобального состояния приложения
- Кэширования данных
- Синхронизации между компонентами

Компоненты не должны импортировать store напрямую. Вместо этого используются хуки:

```typescript
// ✅ Правильно: через хук
import { useTheme } from '@/hooks/useTheme'

function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme()
  // ...
}

// ❌ Неправильно: напрямую из store
import { useThemeStore } from '@/store'

function ThemeToggle() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode)
  // ...
}
```

## Примеры из реального кода

### Пример 1: Страница Tasks

**Файл:** `src/pages/Tasks.tsx`

```typescript
import useTasksViewModel from '@/modules/tasks/hooks/useTasksViewModel'
import TaskDetails from '@/modules/tasks/components/TaskDetails'
import CreateParseTaskModal from '@/modules/tasks/components/CreateParseTaskModal'
import TasksHero from '@/modules/tasks/components/TasksHero'
import TasksList from '@/modules/tasks/components/TasksList'

function Tasks() {
  const {
    activeTasks,
    hasGroups,
    groups,
    selectedTaskId,
    isCreateModalOpen,
    handleOpenCreateModal,
    handleCreateTask,
    handleTaskSelect,
    handleCloseTaskDetails,
    handleCloseCreateModal,
  } = useTasksViewModel()

  return (
    <div className="flex flex-col gap-10">
      <TasksHero onCreateTask={handleOpenCreateModal} />
      <TasksList onTaskSelect={handleTaskSelect} />
      {selectedTaskId && (
        <TaskDetails task={getTaskDetails(selectedTaskId)} onClose={handleCloseTaskDetails} />
      )}
      <CreateParseTaskModal
        isOpen={isCreateModalOpen}
        groups={groups}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateTask}
      />
    </div>
  )
}
```

**Особенности:**

- Страница содержит только композицию компонентов
- Вся логика вынесена в хук `useTasksViewModel`
- Компоненты получают данные через props

### Пример 2: ViewModel хук модуля Tasks

**Файл:** `src/modules/tasks/hooks/useTasksViewModel.ts`

```typescript
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTasksStore, useGroupsStore } from '@/store'
import { useTasksQuery } from '@/modules/tasks/hooks/useTasksQuery'
import { useTasksSocket } from '@/modules/tasks/hooks/useTasksSocket'
import { isTaskActive } from '@/modules/tasks/utils/taskProgress'

export const useTasksViewModel = () => {
  const { tasks, fetchTasks, createParseTask } = useTasksStore(
    useShallow((state) => ({
      tasks: state.tasks,
      fetchTasks: state.fetchTasks,
      createParseTask: state.createParseTask,
    }))
  )

  const { groups, fetchGroups } = useGroupsStore(
    useShallow((state) => ({
      groups: state.groups,
      fetchGroups: state.fetchGroups,
    }))
  )

  useTasksQuery()
  useTasksSocket()

  const activeTasks = useMemo(() => tasks.filter(isTaskActive), [tasks])

  const handleCreateTask = useCallback(
    async (groupIds: Array<number | string>) => {
      await createParseTask(groupIds)
    },
    [createParseTask]
  )

  return {
    tasks,
    activeTasks,
    groups,
    handleCreateTask,
    // ... другие значения
  }
}
```

**Особенности:**

- Хук использует store через `useShallow` для оптимизации
- Вызывает query-хуки для загрузки данных
- Содержит всю бизнес-логику страницы
- Возвращает готовые обработчики и данные для компонентов

### Пример 3: Компонент с логикой в хуке

**Файл:** `src/modules/tasks/components/CreateParseTaskModal.tsx`

```typescript
import { Button } from '@/shared/ui/button'
import type { Group } from '@/types'
import { useCreateParseTaskModal } from '@/modules/tasks/hooks/useCreateParseTaskModal'

function CreateParseTaskModal({ isOpen, groups, onClose, onSubmit }: Props) {
  const {
    selectedIds,
    search,
    setSearch,
    filteredGroups,
    handleToggle,
    handleSelectAll,
    handleDeselectAll,
  } = useCreateParseTaskModal(groups, isOpen)

  return (
    <div>
      {/* UI компонента */}
    </div>
  )
}
```

**Особенности:**

- Компонент получает данные через props
- Вся логика фильтрации и выбора вынесена в хук `useCreateParseTaskModal`
- Компонент содержит только UI-логику

### Пример 4: Query хук с React Query

**Файл:** `src/modules/tasks/hooks/useTasksQuery.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { tasksService } from '@/services/tasksService'
import { useTasksStore } from '@/store'
import { queryKeys } from '@/hooks/queryKeys'

export const useTasksQuery = () => {
  const query = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: tasksService.fetchTasks, // services используется в queryFn
    refetchInterval: 15_000,
  })

  useEffect(() => {
    if (query.data) {
      useTasksStore.setState({ tasks: query.data }) // store обновляется здесь
    }
  }, [query.data])

  return query
}
```

**Особенности:**

- Services используется напрямую в `queryFn` (стандартный паттерн React Query)
- Store обновляется через `useEffect` после получения данных
- Хук возвращает объект query для использования в компонентах

### Пример 5: Компонент модуля с утилитами

**Файл:** `src/modules/comments/components/CommentCard.tsx`

```typescript
import { highlightKeywords } from '@/modules/comments/utils/highlightKeywords'
import { formatDateTime } from '@/modules/comments/utils/formatDateTime'
import { getAuthorInitials } from '@/modules/comments/utils/getAuthorInitials'
import type { Comment } from '@/types'

function CommentCard({ comment, toggleReadStatus }: Props) {
  return (
    <div>
      <div>{highlightKeywords(comment.text)}</div>
      <div>{formatDateTime(comment.date)}</div>
      <div>{getAuthorInitials(comment.author)}</div>
    </div>
  )
}
```

**Особенности:**

- Компонент использует утилиты модуля для форматирования
- Получает данные через props
- Не зависит от store напрямую

### Пример 6: Service для работы с API

**Файл:** `src/services/tasksService.ts`

```typescript
import { API_URL } from '@/lib/apiConfig'
import { createRequest, handleResponse } from '@/lib/apiUtils'
import type { CreateParsingTaskDto } from '@/types/dto'
import type { IParsingTaskResult } from '@/types/api'

export const tasksService = {
  async fetchTasks(): Promise<IParsingTaskSummary[]> {
    const response = await fetch(`${API_URL}/tasks`)
    return await handleResponse<IParsingTaskSummary[]>(response, 'Failed to fetch tasks')
  },

  async createParsingTask(dto: CreateParsingTaskDto): Promise<IParsingTaskResult> {
    const response = await createRequest(`${API_URL}/tasks/parse`, {
      method: 'POST',
      body: JSON.stringify(dto),
    })
    return await handleResponse<IParsingTaskResult>(response, 'Failed to create task')
  },
}
```

**Особенности:**

- Только HTTP-запросы и обработка ответов
- Использует утилиты из `lib/` для работы с API
- Не содержит UI-логику
- Типизирован через общие типы из `types/`

### Пример 7: Store с использованием services

**Файл:** `src/store/tasksStore.ts`

```typescript
import { create } from 'zustand'
import { tasksService } from '@/services/tasksService'
import type { Task } from '@/types'

interface TasksState {
  tasks: Task[]
  isLoading: boolean
  fetchTasks: () => Promise<void>
  createParseTask: (groupIds: Array<number | string>) => Promise<number | null>
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true })
    try {
      const tasks = await tasksService.fetchTasks()
      set({ tasks, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  createParseTask: async (groupIds) => {
    const dto = { groupIds }
    const result = await tasksService.createParsingTask(dto)
    // обновление состояния
    return result.id
  },
}))
```

**Особенности:**

- Store использует services для загрузки данных
- Предоставляет API для компонентов через хуки
- Может использовать utils для преобразования данных

## Чек-лист для новых фич

При добавлении новой фичи:

1. ✅ Создать модуль в `modules/{moduleName}/`
2. ✅ Добавить компоненты в `modules/{moduleName}/components/`
3. ✅ Добавить хуки в `modules/{moduleName}/hooks/`
4. ✅ Использовать алиас `@/` для всех импортов (включая внутримодульные)
5. ✅ Вынести бизнес-логику из компонентов в хуки
6. ✅ Использовать store через хуки, а не напрямую
7. ✅ Использовать services в React Query queryFn или для одноразовых операций
8. ✅ Следовать правилам зависимостей между слоями
9. ✅ Добавить опциональные папки (config/, types/, utils/, constants/) только если они специфичны для модуля

## Аудит архитектуры

### Автоматические проверки

Для проверки соответствия архитектуре используется скрипт:

```bash
npm run audit:architecture
```

Скрипт проверяет:

- Использование alias `@/` вместо относительных импортов в модулях
- Отсутствие прямых импортов store в компонентах модулей
- Отсутствие импортов services/store в utils
- Соответствие структуры модулей стандартам (наличие обязательных папок components/ и hooks/)
- Соблюдение правил зависимостей между слоями

### ESLint правила

В проекте настроены ESLint правила для автоматической проверки архитектуры:

**Правила для компонентов модулей:**

- Запрет импорта `@/store` напрямую
- Компоненты должны использовать хуки модуля

**Правила для utils:**

- Запрет импорта `@/services` и `@/store`
- Utils должны оставаться чистыми функциями

**Запуск проверки:**

```bash
npm run lint
```

Правила настроены в `eslint.config.js` и используют встроенное правило `no-restricted-imports`.

## Рекомендации по рефакторингу

### Большие компоненты

Если компонент превышает 200-300 строк, рекомендуется разбить его на более мелкие части:

1. **Вынести логику в хук** — вся бизнес-логика должна быть в хуке
2. **Разбить на подкомпоненты** — большие компоненты можно разбить на несколько меньших
3. **Вынести конфигурацию** — таблицы, формы и другие конфигурации вынести в `config/`

**Пример рефакторинга:**

```typescript
// ❌ До: большой компонент
function WatchlistAuthorsTable({ authors, ... }: Props) {
  // 300+ строк кода с логикой и UI
}

// ✅ После: разбит на части
function WatchlistAuthorsTable({ authors, ... }: Props) {
  const { sortedAuthors, ... } = useWatchlistTableLogic(authors)

  return (
    <Table>
      <WatchlistAuthorsTableHeader />
      <WatchlistAuthorsTableBody authors={sortedAuthors} />
    </Table>
  )
}
```

### Дублирование кода

Если логика повторяется в нескольких модулях:

1. **Вынести в общие хуки** — если логика используется в разных модулях, вынести в `hooks/`
2. **Вынести в общие утилиты** — если это чистые функции, вынести в `utils/`
3. **Создать общий компонент** — если UI повторяется, вынести в `components/`

### Добавление новых модулей

При добавлении нового модуля следуйте чек-листу выше и убедитесь, что:

- Модуль изолирован от других модулей
- Использует общие компоненты из `components/`
- Логика вынесена в хуки модуля
- Store используется через хуки, а не напрямую

## Текущее состояние архитектуры

✅ Все модули соответствуют стандартной структуре  
✅ Все импорты используют alias `@/`  
✅ Компоненты не импортируют store напрямую  
✅ Модули изолированы друг от друга  
✅ Utils не содержат зависимостей от services/store  
✅ Правила зависимостей соблюдаются  
✅ ESLint правила настроены для автоматической проверки  
✅ Скрипт аудита архитектуры покрывает все основные правила
