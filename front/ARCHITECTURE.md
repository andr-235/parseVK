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
import { Button } from '@/components/ui/button'
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
    └── index.ts  # ListingsMeta, ListingsFetcherParams
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

Для проверки соответствия архитектуре используется скрипт:

```bash
npm run audit:architecture
```

Скрипт проверяет:
- Использование alias `@/` вместо относительных импортов
- Отсутствие прямых импортов store в компонентах модулей
- Отсутствие импортов services/store в utils
- Соответствие структуры модулей стандартам
- Соблюдение правил зависимостей между слоями

## Текущее состояние архитектуры

✅ Все модули соответствуют стандартной структуре  
✅ Все импорты используют alias `@/`  
✅ Компоненты не импортируют store напрямую  
✅ Модули изолированы друг от друга  
✅ Utils не содержат зависимостей от services/store  
✅ Правила зависимостей соблюдаются  
✅ ESLint правила настроены для автоматической проверки

