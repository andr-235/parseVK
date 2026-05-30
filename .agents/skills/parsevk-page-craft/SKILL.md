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
├── {PageName}Page.tsx         # корневая страница
├── components/                # компоненты страницы
│   ├── {Feature}Section.tsx
│   ├── {Feature}Card.tsx
│   ├── {Feature}Row.tsx
│   ├── {Feature}Header.tsx
│   └── {Feature}Results.tsx
├── hooks/                     # хуки для логики
│   └── use{Feature}.ts
├── config/                    # конфиги, колонки таблиц
│   └── {feature}Columns.tsx
├── utils/                     # хелперы, статусы
│   └── {feature}Helpers.ts
└── api/                       # API-вызовы
    └── {feature}.api.ts
```

**Правило размера компонента:** каждый компонент не больше 100–150 строк. Если компонент растёт — выделить подкомпоненты (Header, Results, Row).

### 4. Implement page following DESIGN.md tokens

**Цвета — только CSS-переменные:**

```tsx
// ✅ Правильно
className="bg-background-primary text-text-primary border-border/50"

// ❌ Неправильно  
className="bg-slate-900 text-gray-100 border-zinc-700/50"
```

Основные токены из TOKEN-REFERENCE.md:

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
| Скругление карточек | `rounded-card` |
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

**Вариант A — PageContainer + PageHeader (стандартный):**

```tsx
<PageContainer maxWidth="1600px" animate={false}>
  <PageHeader
    title="Страница"
    description="Описание страницы."
    actions={<ActionButtons />}
  />

  <div className="flex flex-col gap-8">
    <FeatureSection ... />
  </div>

  {/* Sheet вместо Modal для деталей */}
  <Sheet>...</Sheet>
</PageContainer>
```

**Вариант B — Компактный хедер (для плотных страниц):**

```tsx
<PageContainer maxWidth="1600px" animate={false}>
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="space-y-1">
      <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-text-light">
        <Icon className="size-5 text-accent-primary" />
        Название
      </h1>
      <p className="text-sm text-text-secondary">Описание.</p>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* инпуты, кнопки */}
    </div>
  </div>

  {/* секции */}
  <div className="flex flex-col gap-8">
    <FeatureSection ... />
  </div>
</PageContainer>
```

**Карточный грид (для визуального контента):**

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</div>
```

**Collapsible панель (для дополнительных фич):**

```tsx
<section className="overflow-hidden rounded-card border border-border/60 bg-background-secondary shadow-soft-sm">
  <button onClick={() => setOpen(v => !v)} className="...">
    ...chevron, заголовок, actions
  </button>
  {open && <div className="border-t border-border/40">{/* content */}</div>}
</section>
```

### 7. Extract repeating JSX

Если компонент перевалил за 150 строк — выделить подкомпоненты:

```tsx
// До: RegionGroupsSearchCard (421 строки)
// После:
//   RegionSearchHeader.tsx   (70 строк) — заголовок, кнопки поиска/сброса
//   RegionSearchResults.tsx  (138 строк) — тулбар с сортировкой + список
//   RegionGroupRow.tsx       (89 строк) — одна строка результата
//   RegionGroupsSearchCard.tsx (168 строк) — корневой collapsible компонент
```

Паттерн выделения:
1. Заголовок/шапка секции → `{Feature}Header.tsx`
2. Панель результатов с тулбаром → `{Feature}Results.tsx`
3. Отдельная строка/карточка → `{Feature}Row.tsx` / `{Feature}Card.tsx`
4. Массивы данных рендерятся через `.map()` — нет дублирования разметки

### 8. Accessibility

**Обязательно:**
- Все кнопки: `aria-label` если нет текста
- Кастомные `<button>` без variant: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30`
- Custom checkbox: `<input type="checkbox">` + декоративный SVG с `aria-hidden="true"`
- Декоративные иконки: `aria-hidden="true"`
- Empty states: `role="region" aria-label="..."` (не `role="status"`)
- Скелетоны: `aria-busy="true" aria-label="Загрузка..."`
- Sentinel-элементы (IntersectionObserver): `aria-hidden="true"`
- Изображения: `alt` + `loading="lazy"` для оффскрин
- Destructive кнопки: цвет — не единственный индикатор (добавить icon или текст)

**Дополнительно:**
- Кликабельные элементы: `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space)
- Кастомные контролы: `role`, `aria-checked`/`aria-selected`
- ProgressBar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- DataTable: `aria-sort` на заголовках сортируемых колонок
- Модалы: `role="dialog"`, `aria-modal="true"`, focus trap, Escape для закрытия

### 9. Motion

- `transition-colors duration-200` — для hover/active состояний
- `transition-opacity duration-200` — для show/hide
- Карточки: `hover:shadow-soft-md` + `transition-colors` (не `transition-all`)
- Collapsible секции: без анимации раскрытия (просто show/hide)
- Не анимировать layout-свойства (width, height, padding, margin, border)
- Не использовать `animate-in fade-in` на контентных элементах
- ProgressBar: framer-motion для анимации заполнения — ок, но без стекла/блюра

### 10. Touch targets

- Минимум `h-9` (36px) для кнопок. В идеале `h-10` (40px).
- `h-7` (28px) и `size-7` — запрещены. Слишком малы для touch.
- WCAG 2.5.8 рекомендует 24px min, но практический стандарт — 44px.

### 11. Обратная связь и подтверждения

**Toast после мутаций:**

```tsx
import toast from 'react-hot-toast'

toast.success('Группа добавлена')
toast.error('Не удалось добавить группу')
```

**Two-click delete (без модала):**

```tsx
const [confirming, setConfirming] = useState(false)
const timer = useRef<ReturnType<typeof setTimeout>>()

const handleDelete = useCallback(() => {
  if (confirming) { onDelete(id); setConfirming(false); clearTimeout(timer.current) }
  else { setConfirming(true); timer.current = setTimeout(() => setConfirming(false), 3000) }
}, [confirming, onDelete, id])

useEffect(() => () => clearTimeout(timer.current), [])

<Button className={confirming ? 'bg-destructive/15 text-accent-danger' : '...'}>
  {confirming ? <AlertTriangle /> : <Trash2 />}
  {confirming ? 'Удалить?' : 'Удалить'}
</Button>
```

### 12. Verify

```bash
cd front
npx tsc --noEmit
npx eslint "src/pages/{page-name}/**/*.{ts,tsx}"
npx vite build
```

## Output format

- Созданные/изменённые файлы
- Каждый файл: название, строк кода, ключевые решения
- Какие паттерны использованы (card grid, collapsible section, infinite scroll, map extraction)
- Какие токены использованы

## Safety rules

- Не изменять shared-компоненты вне scope задачи
- Не добавлять npm-пакеты без явного запроса
- Не удалять/переименовывать существующие файлы без явного запроса
- Не коммитить. Только локальные изменения.

## Validation expectations

- `tsc -b` — без ошибок
- `vite build` — успешно
- Все цвета — CSS-переменные, не хардкоды
- Нет `text-[Npx]`, `bg-slate-*`, `#fff`, `#000`
- Нет `transition-all` на layout-свойствах
- Нет кнопок `h-7` / `size-7`
- `focus-visible` на всех кастомных `<button>` без variant
- `aria-hidden="true"` на декоративных иконках и sentinel-элементах
- Loading, empty, error states присутствуют
- Destructive действия имеют подтверждение
