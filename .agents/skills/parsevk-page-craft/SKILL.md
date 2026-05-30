---
name: parsevk-page-craft
description: Implement pages consistently with parseVK design system (DESIGN.md, PRODUCT.md). Covers layout, components, tokens, status patterns, hooks, stores, and accessibility. Use when building a new page, redesigning an existing screen, or adding a feature to a page.
---

# parsevk-page-craft

## Purpose

Реализовывать страницы frontend консистентно с дизайн-системой parseVK: цветовые токены, типографика, компоненты, паттерны статусов, хуки, стор.

## When to use

- Новая страница: любой экран внутри приложения (tasks, groups, monitoring, authors, exports, etc.)
- Редизайн существующей страницы
- Добавление новой секции/компонента на существующую страницу
- Рефакторинг повторяющегося JSX в переиспользуемые компоненты

## When not to use

- Изменения в shared-компонентах (ui/button, common/DataTable) — это extract, не page craft
- Глобальные изменения темы или токенов — это teach/document
- Бэкенд или API-слой — это service-architecture

## Inputs

- Название страницы или маршрута (например, `telegram-dl-upload`)
- Требования к функциональности (какие данные показывает, какие действия доступны)
- Существующий файл страницы (если редизайн)

## Procedure

### 1. Load design context

Перед любой работой загрузить контекст:

```bash
node .agents/skills/impeccable/scripts/load-context.mjs
```

Загружает PRODUCT.md и DESIGN.md. Если они отсутствуют — запустить `teach`.

### 2. Identify register and load product reference

Страница parseVK — всегда **product register**. Загрузить:

```bash
cat .agents/skills/impeccable/reference/product.md
```

### 3. Choose component architecture

Для новой страницы создать структуру:

```
pages/{page-name}/
├── index.ts                   # реэкспорт
├── {PageName}Page.tsx         # корневая страница (PageContainer + PageHeader + секции)
├── components/                # компоненты страницы
│   ├── {Feature}Section.tsx
│   ├── {Feature}Modal.tsx
│   └── {Feature}Cell.tsx
├── hooks/                     # хуки для логики
│   └── use{Feature}.ts
├── config/                    # конфиги, колонки таблиц
│   └── {feature}Columns.tsx
├── utils/                     # хелперы, статусы
│   └── {feature}Helpers.ts
└── api/                       # API-вызовы
    └── {feature}.api.ts
```

### 4. Implement page following DESIGN.md tokens

**Цвета — только CSS-переменные:**

```tsx
// ✅ Правильно
className="bg-background-primary text-text-primary border-border/50"

// ❌ Неправильно  
className="bg-slate-900 text-gray-100 border-zinc-700/50"
```

Основные токены из DESIGN.md:

| Назначение | Токен Tailwind |
|---|---|
| Фон страницы | `bg-background-primary` (#0f0f11) |
| Фон карточки/панели | `bg-background-secondary` (#18181b) |
| Фон сайдбара | `bg-background-sidebar` (#141416) |
| Основной текст | `text-text-primary` (#d4d4d8) |
| Вторичный текст | `text-text-secondary` (#a1a1aa) |
| Светлый текст | `text-text-light` (#f4f4f5) |
| Акцент (команды) | `text-accent-primary` / `bg-accent-primary` |
| Успех | `text-accent-success` |
| Предупреждение | `text-accent-warning` |
| Ошибка | `text-accent-danger` |
| Инфо | `text-accent-info` |
| Границы | `border-border` |
| Тени | `shadow-soft-sm` / `shadow-soft-md` |

**Типографика — только токены:**

| Назначение | Класс |
|---|---|
| Заголовок страницы | `font-monitoring-display text-3xl font-semibold tracking-tight text-text-light` |
| Заголовок секции | `font-monitoring-display text-xl font-semibold tracking-tight text-text-light` |
| Заголовок карточки | `font-monitoring-body text-base font-semibold text-text-primary` |
| Тело / таблицы | `font-monitoring-body text-sm font-normal text-text-primary` |
| Лейблы | `font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary` |
| ID, счётчики, даты | `font-mono-accent text-xs font-medium text-text-primary` |
| Мета | `font-mono-accent text-xs font-medium text-text-secondary` |

**Запрещено:**
- `text-[10px]`, `text-[0.68rem]`, `text-[14px]` — использовать `text-xs` (12px) или `text-sm` (14px)
- `bg-slate-900`, `text-gray-300` — только CSS-переменные
- `#fff`, `#000` — всегда использовать токены
- `transition-all` — использовать `transition-colors` или `transition-opacity`

### 5. Implement status patterns

Для сущностей со статусами (task, group, service, sync) создать файл `utils/{entity}Helpers.ts` с централизованными статусами:

```tsx
// utils/statusHelpers.ts (для переиспользования между страницами — shared utils)
// utils/{entity}Helpers.ts (для специфичных статусов — локально)

export const getEntityStatusText = (status: string): string => { ... }
export const ENTITY_STATUS_COLORS: Record<string, string> = { ... }
export const ENTITY_STATUS_BADGE: Record<string, string> = { ... }
export const getStatusWeight = (status: string): number => { ... }
```

Статусные цвета — строго из DESIGN.md:
- `accent-primary` — running, processing, active
- `accent-success` — completed, success, synced
- `accent-warning` — pending, queued, stale
- `accent-danger` — failed, error
- `accent-info` — informational, processing

### 6. Build page layout

```tsx
<PageContainer maxWidth="1600px" animate={false}>
  <PageHeader
    title="Страница"
    description="Описание страницы."
    actions={<ActionButtons />}
  />

  {/* Optional: status/info strip — компактный, без border-bottom */}
  {/* Optional: ActiveBanner для живых процессов */}

  <div className="flex flex-col gap-8">
    <FeatureSection ... />
    <ListSection ... />
  </div>

  {/* Sheet вместо Modal для деталей */}
  <Sheet>
    <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-y-auto">
      ...
    </SheetContent>
  </Sheet>

  {/* Modal только если нужна форма */}
  <FormModal ... />
</PageContainer>
```

### 7. Extract repeating JSX

Если в разметке повторяется структура `div + p.label + p.value` — вынести в компонент.

1. Создать компонент с интерфейсом пропсов
2. Определить массив данных
3. Заменить повторения на `.map()`

```tsx
// Before: 9 одинаковых блоков
<StatCell label="Название"><p>...</p></StatCell>
<StatCell label="Статус"><span>...</span></StatCell>
// ... 7 more

// After: массив + map
const cells = [
  { label: 'Название', content: <p>...</p> },
  { label: 'Статус', content: <span>...</span> },
  // ...
]
<div className="grid gap-3 sm:grid-cols-2">
  {cells.map((c) => <StatCell key={c.label}>{c.content}</StatCell>)}
</div>
```

### 8. Accessibility

- Все кнопки: `type="button"`, `aria-label` если нет текста
- Кликабельные элементы: `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space)
- Кастомные контролы (checkbox, switch): `role`, `aria-checked`/`aria-selected`
- Декоративные иконки: `aria-hidden="true"`
- Формы: `<label>` или `aria-label` на каждом input
- ProgressBar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- DataTable: `aria-sort` на заголовках сортируемых колонок
- Модалы/диалоги: `role="dialog"`, `aria-modal="true"`, focus trap, Escape для закрытия

### 9. Motion

- `transition-colors duration-200` — для hover/active состояний
- `transition-opacity duration-200` — для show/hide
- Не анимировать layout-свойства (width, height, padding, margin, border)
- Не использовать `animate-in fade-in` на контентных элементах
- ProgressBar: framer-motion для анимации заполнения — ок, но без стекла/блюра

### 10. Verify

```bash
cd front
./node_modules/.bin/tsc -b
npx vite build
```

## Output format

- Созданные/изменённые файлы
- Каждый файл: название, строк кода, ключевые решения
- Какие паттерны использованы (map extraction, status helpers, sheet вместо modal)

## Safety rules

- Не изменять shared-компоненты вне scope задачи
- Не добавлять npm-пакеты без явного запроса
- Не удалять/переименовывать существующие файлы без явного запроса
- Не коммитить. Только локальные изменения.

## Validation expectations

- `tsc -b` — без ошибок (допускаются только предсуществующие)
- `vite build` — успешно
- Все статусные цвета используют токены, не хардкоды
- Нет `text-[Npx]`, `bg-slate-*`, `#fff`, `#000`
- Нет `transition-all` на layout-свойствах
