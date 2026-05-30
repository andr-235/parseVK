# Page Implementation Standard

## Структура директории страницы

```
pages/{page-name}/
├── index.ts                   # реэкспорт: export { PageName } from './PageNamePage'
├── {PageName}Page.tsx         # корневой компонент страницы
├── components/                # компоненты, специфичные для этой страницы
│   ├── {Feature}Section.tsx   # секция страницы
│   ├── {Feature}Modal.tsx     # модальное окно (когда форма)
│   └── {Feature}Cell.tsx      # карточка элемента
├── hooks/                     # React hooks для бизнес-логики
│   └── use{Feature}.ts
├── config/                    # статические конфиги, колонки таблиц
│   └── {feature}Columns.tsx
├── utils/                     # хелперы, форматирование, статусы
│   └── {feature}Helpers.ts
└── api/                       # API-вызовы (fetch)
    └── {feature}.api.ts
```

## Правила композиции

### PageContainer + PageHeader — всегда корень

Каждая страница начинается с `PageContainer` и `PageHeader`:

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
- `actions` — фрагмент с кнопками через `<React.Fragment>`

### Секции — компоненты с префиксом Section

```tsx
<PageSection title="Секция" count={5}>
  {items.map(item => <ItemCell />)}
</PageSection>
```

Каждая секция:
- Начинается с заголовка и опционального счётчика
- Использует `PageSection` из shared/ui или прямую структуру `div.flex.flex-col.gap-3`

### Повторяющиеся блоки → массив + map

Если блок JSX повторяется 2+ раза (например, StatsCell грид):

```tsx
const cells = [
  { label: 'Всего задач', value: stats.total },
  { label: 'Завершено', value: stats.completed },
]
<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {cells.map(c => <StatCell key={c.label}>{c.value}</StatCell>)}
</div>
```

### Sheet для деталей, Modal для форм

- Детальный просмотр записи → `<Sheet>` (боковая панель, `side="right"`)
- Создание/редактирование → `<FormModal>` / `<Modal>` (центр)

## Статусные хелперы

```tsx
// utils/{entity}Helpers.ts
export const getEntityStatusText = (status: string): string => { ... }
export const ENTITY_STATUS_COLORS: Record<string, string> = { ... }
export const getStatusWeight = (status: string): number => { ... }
```

Если статусная логика общая для нескольких страниц — выносить в `front/src/shared/utils/`.

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

## Экспорт

```tsx
// index.ts
export { PageName } from './PageNamePage'
```

Регистрация роута — в `front/src/app/router.tsx`
