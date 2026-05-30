# Page Implementation Standard

## Структура директории страницы

```
pages/{page-name}/
├── index.ts                   # реэкспорт: export { PageName } from './PageNamePage'
├── {PageName}Page.tsx         # корневой компонент страницы
├── components/                # компоненты, специфичные для этой страницы
│   ├── {Feature}Section.tsx   # секция страницы (таблица, грид, список)
│   ├── {Feature}Card.tsx      # карточка элемента
│   ├── {Feature}Row.tsx       # строка в списке
│   ├── {Feature}Header.tsx    # заголовок секции (кнопки, фильтры)
│   └── {Feature}Results.tsx   # результаты поиска (панель с инструментами)
├── hooks/                     # React hooks для бизнес-логики
│   └── use{Feature}.ts
├── config/                    # статические конфиги, колонки таблиц
│   └── {feature}Columns.tsx
├── utils/                     # хелперы, форматирование, статусы
│   └── {feature}Helpers.ts
└── api/                       # API-вызовы (fetch)
    └── {feature}.api.ts
```

## Выбор лэйаута

### PageContainer + PageHeader — для стандартных страниц

```tsx
<PageContainer maxWidth="1600px" animate={false}>
  <PageHeader
    title="Мониторинг"
    description="Просмотр состояния системы."
    actions={...}
  />
  {/* секции */}
</PageContainer>
```

- `PageContainer animate={false}` — не анимировать контейнер
- `PageHeader` — заголовок, описание, кнопки действий (в `actions`)

### Компактный хедер — для плотных страниц (альтернатива)

Когда `PageHeader` слишком тяжёлый (лишние границы, паддинги, тень):

```tsx
<PageContainer maxWidth="1600px" animate={false}>
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="space-y-1">
      <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-text-light">
        <Icon className="size-5 text-accent-primary" />
        Название
      </h1>
      <p className="text-sm text-text-secondary">
        Описание.
      </p>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* инпуты, кнопки */}
    </div>
  </div>
  {/* секции */}
</PageContainer>
```

## Паттерны композиции

### Карточный грид (альтернатива таблице)

Для сущностей с визуальным контентом (аватар, описание, мета):

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map(item => <EntityCard key={item.id} entity={item} />)}
</div>
```

Карточка использует `rounded-card`, `shadow-soft-sm`, hover в `shadow-soft-md`:

```tsx
<div className="group relative flex flex-col overflow-hidden rounded-card border border-border/60 bg-background-secondary shadow-soft-sm transition-colors duration-200 hover:border-border hover:shadow-soft-md">
```

### Секция с поиском и фильтрацией

```tsx
<section>
  <div className="mb-4 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <h2 className="text-base font-semibold text-text-light">Название</h2>
      <Badge variant="outline" className="border-border/50 bg-background-primary/50 font-mono-accent text-xs text-text-secondary">
        {count}
      </Badge>
    </div>
    <Input placeholder="Поиск..." className="h-9 w-44 bg-background-primary pl-8 text-xs" />
  </div>
  {/* список */}
</section>
```

### Collapsible панель (прогрессивное раскрытие)

Для дополнительных фич, которые не нужны всегда:

```tsx
<section className="overflow-hidden rounded-card border border-border/60 bg-background-secondary shadow-soft-sm">
  <button
    onClick={() => setOpen(v => !v)}
    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-background-sidebar/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 focus-visible:ring-offset-2"
  >
    <div className="flex items-center gap-2.5">
      <ChevronDown className="size-4 text-text-secondary" />
      <Icon className="size-4 text-accent-primary" />
      <span className="text-sm font-semibold text-text-light">Заголовок</span>
    </div>
    {/* actions */}
  </button>

  {open && (
    <div className="border-t border-border/40 p-3">
      {/* content */}
    </div>
  )}
</section>
```

Escape закрывает панель:

```tsx
useEffect(() => {
  if (!open) return
  const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
  document.addEventListener('keydown', onKeyDown)
  return () => document.removeEventListener('keydown', onKeyDown)
}, [open])
```

### Infinite scroll

```tsx
const loadMoreRef = useRef<HTMLDivElement | null>(null)

useIntersectionObserver(loadMoreRef, () => { void loadMore() }, {
  enabled: hasMore && !isLoading,
  threshold: 0.1,
})

// В конце списка:
{hasMore && <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />}

// Спиннер загрузки:
{isLoadingMore && (
  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-text-secondary">
    <Spinner className="size-3" />
    Загрузка...
  </div>
)}
```

## Статусные хелперы

```tsx
// utils/{entity}Helpers.ts
export const getEntityStatusText = (status: string): string => { ... }
export const ENTITY_STATUS_COLORS: Record<string, string> = { ... }
export const getStatusWeight = (status: string): number => { ... }
```

Если статусная логика общая для нескольких страниц — выносить в `front/src/shared/utils/`.

## Состояния загрузки

### Skeleton-сетка (зеркалит структуру карточки)

```tsx
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Загрузка...">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-card border border-border/60 bg-background-secondary shadow-soft-sm">
          <div className="flex items-start gap-3 p-4 pb-3">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex gap-2 border-t border-border/40 p-3">
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 flex-1 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

### Empty state

```tsx
<Empty className="min-h-[240px]" role="region" aria-label="Нет данных">
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <Icon className="size-6" />
    </EmptyMedia>
    <EmptyTitle>Нет добавленных элементов</EmptyTitle>
    <EmptyDescription>Описание, что делать.</EmptyDescription>
  </EmptyHeader>
</Empty>
```

### Подтверждение деструктивных действий

Two-click паттерн (без модала):

```tsx
const [confirming, setConfirming] = useState(false)
const timer = useRef<ReturnType<typeof setTimeout>>()

const handleDelete = useCallback(() => {
  if (confirming) {
    onDelete(id)
    setConfirming(false)
    clearTimeout(timer.current)
  } else {
    setConfirming(true)
    timer.current = setTimeout(() => setConfirming(false), 3000)
  }
}, [confirming, onDelete, id])

useEffect(() => () => clearTimeout(timer.current), [])

<Button
  variant="ghost"
  className={confirming
    ? 'bg-destructive/15 text-accent-danger hover:bg-destructive/25'
    : 'text-text-secondary hover:bg-destructive/10 hover:text-accent-danger'
  }
  onClick={handleDelete}
>
  {confirming ? <AlertTriangle /> : <Trash2 />}
  {confirming ? 'Удалить?' : 'Удалить'}
</Button>
```

## API-слой

API-вызовы в отдельном файле:

```tsx
// api/{entity}.api.ts
import { API_BASE } from '@/shared/config'
import type { Entity } from '@/shared/types'

export const fetchEntities = async (): Promise<Entity[]> => {
  const res = await fetch(`${API_BASE}/${endpoint}`)
  if (!res.ok) throw new Error('Failed to fetch entities')
  return res.json()
}
```

## Обратная связь (toast)

```tsx
import toast from 'react-hot-toast'

// После успешной мутации:
toast.success('Элемент добавлен')
toast.error('Не удалось добавить элемент')
```

## Экспорт

```tsx
// index.ts
export { PageName } from './PageNamePage'
```

Регистрация роута — в `front/src/app/router.tsx`
