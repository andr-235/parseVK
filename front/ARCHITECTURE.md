# Архитектура фронтенд-проекта

## Структура проекта

Кодовая база фронтенда организована по слоистой архитектуре с разделением логически связанных фич (компонентов и хуков).

```
src/
├── pages/              # Страницы и роуты (только композиция фич и страниц)
├── components/         # UI-компоненты фич и общие элементы
│   ├── ui/            # Базовые атомарные UI-компоненты (radix, кнопки, инпуты)
│   ├── common/        # Общие переиспользуемые блоки (Sidebar, Header, ErrorBoundary)
│   └── {feature}/     # Компоненты конкретной фичи (например, tasks, watchlist)
├── hooks/              # Общие хуки и хуки конкретных фич
│   ├── common/        # Общие хуки (useKeyboardNavigation, и т.д.)
│   └── {feature}/     # ViewModel и Query хуки фич (useTasksViewModel, и т.д.)
├── api/                # API-клиенты и описание эндпоинтов по доменам
│   ├── common/        # Общие конфиги, инстансы fetch и утилиты (apiUtils)
│   └── {feature}/     # API-методы фич (tasks.api.ts)
├── store/              # Глобальные Zustand-хранилища
│   ├── common/        # Общие хранилища (navigationStore)
│   └── {feature}/     # Zustand-сторы фич (tasksStore)
├── utils/              # Чистые вспомогательные утилиты
│   ├── common/        # Общие утилиты
│   └── {feature}/     # Специфичные утилиты фич
├── types/              # Описания типов TypeScript
│   ├── common/        # Общие типы
│   └── {feature}/     # Специфичные типы фич
└── lib/                # Системные конфигурации и низкоуровневая логика
```

---

## Правила зависимостей

### Схема зависимостей между слоями

```
pages/
  ↓ может использовать
  components/, hooks/, store/, utils/, types/

components/{feature}/
  ↓ может использовать
  components/ui/, components/common/, hooks/{feature}/, utils/, types/
  ❌ ЗАПРЕЩЕНО импортировать из компонентов других фич components/{otherFeature}
  ❌ ЗАПРЕЩЕНО импортировать store напрямую (@/store/*)

hooks/{feature}/
  ↓ может использовать
  store/{feature}/, api/{feature}/, utils/, types/
  ❌ ЗАПРЕЩЕНО импортировать компоненты (components/*)
  ❌ ЗАПРЕЩЕНО импортировать хуки других фич hooks/{otherFeature}

api/
  ↓ может использовать
  lib/, utils/, types/

store/
  ↓ может использовать
  api/, utils/, types/

utils/
  ↓ может использовать
  types/
  ❌ ЗАПРЕЩЕНО импортировать api, store или компоненты

types/
  ↓ не зависит ни от чего
```

---

## Импорты и Алиас `@/`

Все импорты между слоями должны использовать абсолютный алиас `@/` вместо относительных путей:

```typescript
// ✅ Правильно
import { Button } from '@/components/ui/button'
import { useTasksViewModel } from '@/hooks/tasks/useTasksViewModel'
import { highlightKeywords } from '@/utils/comments/highlightKeywords'

// ❌ Неправильно
import { Button } from '../../../components/ui/button'
import { highlightKeywords } from '../utils/highlightKeywords'
```

---

## Разделение логики (Паттерн MVVM)

### Компоненты
Компоненты должны содержать исключительно UI-логику (рендер разметки, стили, анимации). Вся бизнес-логика, управление состоянием и сайд-эффекты должны выноситься в хук ViewModel соответствующей фичи:

```typescript
// ✅ Правильно: вся логика находится в хуке ViewModel
import { useCreateParseTaskModal } from '@/hooks/tasks/useCreateParseTaskModal'

function CreateParseTaskModal({ isOpen, groups, onClose, onSubmit }: Props) {
  const {
    selectedIds,
    search,
    setSearch,
    filteredGroups,
    handleToggle,
    handleSelectAll,
  } = useCreateParseTaskModal(groups, isOpen)

  return (
    <div>
      {/* Рендеринг UI на основе ViewModel */}
    </div>
  )
}
```

### Хуки ViewModel
Хуки фичи оркестрируют состояние. Они подписываются на Zustand store, вызывают методы API и сокетов, форматируют данные и возвращают готовые методы-обработчики для компонентов.

---

## Работа с API и State Sync (React Query + Zustand)

Для работы с HTTP-запросами используется **TanStack React Query**. Zustand сторы используются для персистентности (сохранения важных данных в localStorage) и работы с веб-сокетами в реальном времени.

1. **React Query**: отвечает за кэширование, повторные запросы, инвалидацию и фоновые обновления.
2. **Zustand**: используется как централизованный кэш-клиент. При получении новых данных через React Query, хук-запрос синхронизирует Zustand-состояние через `useStore.setState(...)`.
3. **WebSockets**: сокет-события (например, прогресс выполнения парсинга) напрямую обновляют Zustand-стейт, обеспечивая мгновенную реактивность интерфейса без полной перезагрузки данных.

---

## Аудит архитектуры и автоматические проверки

Для поддержания чистоты архитектуры в проекте настроены два инструмента:

1. **Скрипт проверки структуры и зависимостей**:
   ```bash
   npm run audit:architecture
   ```
   Проверяет использование `@/` алиасов, отсутствие импортов store в компонентах и правильность относительных путей между слоями.

2. **ESLint правила ( boundaries и restricted-imports )**:
   ```bash
   npm run lint
   ```
   * Блокирует перекрестные импорты между компонентами разных фич.
   * Запрещает импорт `@/store` из папки `components/`.
   * Запрещает импорты `api` и `store` из чистых утилит `utils/`.
