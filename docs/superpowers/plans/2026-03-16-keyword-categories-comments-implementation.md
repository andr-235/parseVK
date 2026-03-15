# Keyword Categories And Comment Tags Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить группировку словаря ключевых слов по категориям и интерактивные теги категорий в комментариях с клиентской фильтрацией по ним.

**Architecture:** Использовать существующее поле `Keyword.category` как единый источник истины. На фронтенде вынести производную логику в небольшие utils/controller-слои: словарь разбивать на секции по категориям, а для комментариев вычислять уникальные категории из `matchedKeywords` и фильтровать уже загруженную выборку без изменения базового API.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, shadcn/ui, существующие модули `front/src/modules/keywords` и `front/src/modules/comments`.

---

## Chunk 1: Подготовка производной логики категорий

### Task 1: Утилиты группировки словаря

**Files:**
- Create: `front/src/modules/keywords/utils/groupKeywordsByCategory.ts`
- Create: `front/src/modules/keywords/utils/__tests__/groupKeywordsByCategory.test.ts`
- Modify: `front/src/modules/keywords/components/KeywordsTableCard.tsx`
- Modify: `front/src/shared/types/common.ts`

- [ ] **Step 1: Написать падающий unit-тест для группировки слов**

```ts
import { describe, expect, it } from 'vitest'
import { groupKeywordsByCategory } from '../groupKeywordsByCategory'

describe('groupKeywordsByCategory', () => {
  it('groups keywords by category and keeps uncategorized items in fallback bucket', () => {
    const groups = groupKeywordsByCategory([
      { id: 1, word: 'ремонт', category: 'Услуги' },
      { id: 2, word: 'сантехник', category: 'Услуги' },
      { id: 3, word: 'скидка', category: null },
    ])

    expect(groups.map((group) => group.category)).toEqual(['Услуги', 'Без категории'])
    expect(groups[0].keywords).toHaveLength(2)
    expect(groups[1].keywords).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `bun test front/src/modules/keywords/utils/__tests__/groupKeywordsByCategory.test.ts`

Expected: FAIL with `Cannot find module '../groupKeywordsByCategory'` or equivalent.

- [ ] **Step 3: Написать минимальную реализацию группировки**

```ts
const UNCATEGORIZED_LABEL = 'Без категории'

export function groupKeywordsByCategory(keywords: Keyword[]) {
  const buckets = new Map<string, Keyword[]>()

  for (const keyword of keywords) {
    const bucket = keyword.category?.trim() || UNCATEGORIZED_LABEL
    const list = buckets.get(bucket) ?? []
    list.push(keyword)
    buckets.set(bucket, list)
  }

  return Array.from(buckets.entries()).map(([category, keywords]) => ({
    category,
    keywords,
  }))
}
```

- [ ] **Step 4: Обновить типы для секций словаря**

```ts
export interface KeywordCategoryGroup {
  category: string
  keywords: Keyword[]
}
```

- [ ] **Step 5: Повторно запустить unit-тест**

Run: `bun test front/src/modules/keywords/utils/__tests__/groupKeywordsByCategory.test.ts`

Expected: PASS.

- [ ] **Step 6: Закоммитить подготовку утилиты**

```bash
git add front/src/modules/keywords/utils/groupKeywordsByCategory.ts front/src/modules/keywords/utils/__tests__/groupKeywordsByCategory.test.ts front/src/modules/keywords/components/KeywordsTableCard.tsx front/src/shared/types/common.ts
git commit -m "test: добавлены проверки группировки слов по категориям"
```

### Task 2: Утилиты категорий комментариев

**Files:**
- Create: `front/src/modules/comments/utils/getCommentCategories.ts`
- Create: `front/src/modules/comments/utils/filterCommentsByCategories.ts`
- Create: `front/src/modules/comments/utils/__tests__/getCommentCategories.test.ts`
- Create: `front/src/modules/comments/utils/__tests__/filterCommentsByCategories.test.ts`
- Modify: `front/src/modules/comments/types/commentsTable.ts`
- Modify: `front/src/shared/types/common.ts`

- [ ] **Step 1: Написать падающие unit-тесты для категорий комментария**

```ts
import { describe, expect, it } from 'vitest'
import { getCommentCategories } from '../getCommentCategories'

describe('getCommentCategories', () => {
  it('returns unique non-empty categories from matched keywords', () => {
    const categories = getCommentCategories([
      { id: 1, word: 'ремонт', category: 'Услуги' },
      { id: 2, word: 'мастер', category: 'Услуги' },
      { id: 3, word: 'скидка', category: 'Акции' },
      { id: 4, word: 'без тега', category: null },
    ])

    expect(categories).toEqual(['Услуги', 'Акции'])
  })
})
```

```ts
import { describe, expect, it } from 'vitest'
import { filterCommentsByCategories } from '../filterCommentsByCategories'

describe('filterCommentsByCategories', () => {
  it('keeps comment when at least one selected category matches', () => {
    const result = filterCommentsByCategories(
      [
        { comment: { id: 1 }, categories: ['Услуги'] },
        { comment: { id: 2 }, categories: ['Акции'] },
      ],
      ['Акции', 'Срочно']
    )

    expect(result.map((item) => item.comment.id)).toEqual([2])
  })
})
```

- [ ] **Step 2: Запустить оба теста и убедиться, что они падают**

Run: `bun test front/src/modules/comments/utils/__tests__/getCommentCategories.test.ts front/src/modules/comments/utils/__tests__/filterCommentsByCategories.test.ts`

Expected: FAIL with missing module errors.

- [ ] **Step 3: Реализовать минимальные утилиты категорий**

```ts
export function getCommentCategories(matchedKeywords: Keyword[] = []) {
  return Array.from(
    new Set(matchedKeywords.map((keyword) => keyword.category?.trim()).filter(Boolean))
  ) as string[]
}
```

```ts
export function filterCommentsByCategories<T extends { categories: string[] }>(
  items: T[],
  selectedCategories: string[]
) {
  if (selectedCategories.length === 0) return items
  return items.filter((item) =>
    item.categories.some((category) => selectedCategories.includes(category))
  )
}
```

- [ ] **Step 4: Добавить производные типы для комментариев**

```ts
export interface CommentCategoryTagged {
  categories: string[]
}
```

- [ ] **Step 5: Повторно запустить unit-тесты**

Run: `bun test front/src/modules/comments/utils/__tests__/getCommentCategories.test.ts front/src/modules/comments/utils/__tests__/filterCommentsByCategories.test.ts`

Expected: PASS.

- [ ] **Step 6: Закоммитить слой производной логики**

```bash
git add front/src/modules/comments/utils/getCommentCategories.ts front/src/modules/comments/utils/filterCommentsByCategories.ts front/src/modules/comments/utils/__tests__/getCommentCategories.test.ts front/src/modules/comments/utils/__tests__/filterCommentsByCategories.test.ts front/src/modules/comments/types/commentsTable.ts front/src/shared/types/common.ts
git commit -m "test: добавлены утилиты категорий для комментариев"
```

## Chunk 2: UI словаря ключевых слов

### Task 3: Секции категорий в словаре

**Files:**
- Modify: `front/src/modules/keywords/components/KeywordsTableCard.tsx`
- Create: `front/src/modules/keywords/components/KeywordCategorySection.tsx`
- Create: `front/src/modules/keywords/components/__tests__/KeywordsTableCard.test.tsx`
- Modify: `front/src/modules/keywords/config/keywordTableColumns.tsx`
- Modify: `front/src/modules/keywords/components/KeywordCard.tsx`

- [ ] **Step 1: Написать падающий component-тест для секций категорий**

```tsx
import { render, screen } from '@testing-library/react'
import KeywordsTableCard from '../KeywordsTableCard'

it('renders grouped keyword sections with uncategorized fallback', () => {
  render(
    <KeywordsTableCard
      keywords={[
        { id: 1, word: 'ремонт', category: 'Услуги' },
        { id: 2, word: 'акция', category: null },
      ]}
      isLoading={false}
      onDelete={() => {}}
      searchTerm=""
      onSearchChange={() => {}}
    />
  )

  expect(screen.getByText('Услуги')).toBeInTheDocument()
  expect(screen.getByText('Без категории')).toBeInTheDocument()
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `cd front && bun test src/modules/keywords/components/__tests__/KeywordsTableCard.test.tsx`

Expected: FAIL because the component still renders a flat list.

- [ ] **Step 3: Вынести секцию категории и подключить её в таблицу словаря**

```tsx
<KeywordCategorySection
  key={group.category}
  category={group.category}
  count={group.keywords.length}
  keywords={group.keywords}
  isExpanded={expanded[group.category] ?? true}
  onToggle={() => toggleGroup(group.category)}
  onDelete={onDelete}
/>
```

- [ ] **Step 4: Сохранить совместимость поиска и сортировки**

```ts
const groupedKeywords = useMemo(
  () => groupKeywordsByCategory(sortedKeywords),
  [sortedKeywords]
)
```

- [ ] **Step 5: Запустить component-тест и смежный набор**

Run: `cd front && bun test src/modules/keywords/components/__tests__/KeywordsTableCard.test.tsx src/modules/keywords/utils/__tests__/groupKeywordsByCategory.test.ts`

Expected: PASS.

- [ ] **Step 6: Закоммитить UI словаря**

```bash
git add front/src/modules/keywords/components/KeywordsTableCard.tsx front/src/modules/keywords/components/KeywordCategorySection.tsx front/src/modules/keywords/components/__tests__/KeywordsTableCard.test.tsx front/src/modules/keywords/config/keywordTableColumns.tsx front/src/modules/keywords/components/KeywordCard.tsx
git commit -m "feat: сгруппирован словарь ключевых слов по категориям"
```

## Chunk 3: Теги и фильтрация категорий в комментариях

### Task 4: Панель фильтров категорий и wiring в controller

**Files:**
- Modify: `front/src/modules/comments/hooks/useCommentsTableCardController.ts`
- Create: `front/src/modules/comments/components/CommentCategoryFilters.tsx`
- Create: `front/src/modules/comments/components/__tests__/CommentCategoryFilters.test.tsx`
- Modify: `front/src/modules/comments/components/CommentsTableCard.tsx`
- Modify: `front/src/modules/comments/types/commentsTable.ts`

- [ ] **Step 1: Написать падающий component-тест для фильтра категорий**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentCategoryFilters } from '../CommentCategoryFilters'

it('toggles selected categories', async () => {
  const user = userEvent.setup()
  const onToggle = vi.fn()

  render(
    <CommentCategoryFilters
      categories={['Услуги', 'Акции']}
      selectedCategories={['Услуги']}
      onToggleCategory={onToggle}
    />
  )

  await user.click(screen.getByRole('button', { name: /акции/i }))
  expect(onToggle).toHaveBeenCalledWith('Акции')
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `cd front && bun test src/modules/comments/components/__tests__/CommentCategoryFilters.test.tsx`

Expected: FAIL with missing component/module.

- [ ] **Step 3: Реализовать фильтры и добавить state выбранных категорий в controller**

```ts
const [selectedCategories, setSelectedCategories] = useState<string[]>([])

const toggleFilterCategory = useCallback((category: string) => {
  setSelectedCategories((current) =>
    current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]
  )
}, [])
```

- [ ] **Step 4: Встроить фильтрацию в `CommentsTableCard`**

```ts
const filteredGroups = useMemo(
  () =>
    groupedComments
      .map((group) => ({
        ...group,
        comments: filterCommentsByCategories(group.comments, selectedCategories),
      }))
      .filter((group) => group.comments.length > 0),
  [groupedComments, selectedCategories]
)
```

- [ ] **Step 5: Запустить тест фильтра и связанные unit-тесты**

Run: `cd front && bun test src/modules/comments/components/__tests__/CommentCategoryFilters.test.tsx src/modules/comments/utils/__tests__/filterCommentsByCategories.test.ts`

Expected: PASS.

- [ ] **Step 6: Закоммитить панель фильтров**

```bash
git add front/src/modules/comments/hooks/useCommentsTableCardController.ts front/src/modules/comments/components/CommentCategoryFilters.tsx front/src/modules/comments/components/__tests__/CommentCategoryFilters.test.tsx front/src/modules/comments/components/CommentsTableCard.tsx front/src/modules/comments/types/commentsTable.ts
git commit -m "feat: добавлен фильтр комментариев по категориям"
```

### Task 5: Теги категорий на карточках комментариев

**Files:**
- Modify: `front/src/modules/comments/components/CommentCard.tsx`
- Modify: `front/src/modules/comments/components/PostGroupCard.tsx`
- Create: `front/src/modules/comments/components/__tests__/CommentCard.test.tsx`
- Modify: `front/src/modules/comments/components/CommentsTableCard.tsx`
- Modify: `front/src/modules/comments/utils/resolveCommentKeywords.ts`

- [ ] **Step 1: Написать падающий component-тест для тегов на карточке**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommentCard from '../CommentCard'

it('renders category tags and notifies about category click', async () => {
  const user = userEvent.setup()
  const onCategoryClick = vi.fn()

  render(
    <CommentCard
      comment={commentFactory()}
      index={1}
      toggleReadStatus={async () => {}}
      matchedKeywords={[
        { id: 1, word: 'ремонт', category: 'Услуги' },
        { id: 2, word: 'скидка', category: 'Акции' },
      ]}
      onCategoryClick={onCategoryClick}
    />
  )

  await user.click(screen.getByRole('button', { name: /услуги/i }))
  expect(onCategoryClick).toHaveBeenCalledWith('Услуги')
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `cd front && bun test src/modules/comments/components/__tests__/CommentCard.test.tsx`

Expected: FAIL because the card does not render category tags yet.

- [ ] **Step 3: Вычислить категории и отрисовать badge-кнопки**

```tsx
const categories = getCommentCategories(matchedKeywords)

{categories.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {categories.map((category) => (
      <button key={category} type="button" onClick={() => onCategoryClick?.(category)}>
        <Badge>{category}</Badge>
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 4: Прокинуть обработчик клика от `CommentsTableCard` до `CommentCard` и `PostGroupCard`**

```tsx
<CommentCard
  ...
  onCategoryClick={toggleFilterCategory}
/>
```

- [ ] **Step 5: Запустить тест карточки и связанный набор**

Run: `cd front && bun test src/modules/comments/components/__tests__/CommentCard.test.tsx src/modules/comments/components/__tests__/CommentCategoryFilters.test.tsx`

Expected: PASS.

- [ ] **Step 6: Закоммитить теги категорий**

```bash
git add front/src/modules/comments/components/CommentCard.tsx front/src/modules/comments/components/PostGroupCard.tsx front/src/modules/comments/components/__tests__/CommentCard.test.tsx front/src/modules/comments/components/CommentsTableCard.tsx front/src/modules/comments/utils/resolveCommentKeywords.ts
git commit -m "feat: добавлены теги категорий на карточки комментариев"
```

## Chunk 4: Проверка целостности и финишная верификация

### Task 6: Интеграционная проверка сценария

**Files:**
- Modify: `front/src/modules/comments/components/CommentsTableCard.tsx`
- Modify: `front/src/modules/keywords/components/KeywordsPage.tsx`
- Modify: `front/src/modules/comments/components/CommentsPage.tsx`
- Modify: `front/src/setupTests.ts`

- [ ] **Step 1: Добавить финальный smoke-тест для пользовательского потока**

```tsx
it('filters comments after clicking category tag and keeps keyword dictionary grouped', async () => {
  // render both flows with fixtures
  // assert grouped sections exist
  // click category tag
  // assert only matching comments remain
})
```

- [ ] **Step 2: Запустить smoke-тест и убедиться, что он падает до последних правок**

Run: `cd front && bun test src/modules/comments/components/__tests__/CommentsTableCard.integration.test.tsx`

Expected: FAIL with missing assertions or incomplete wiring.

- [ ] **Step 3: Завершить последние несостыковки пропсов, текстов и пустых состояний**

```ts
// Final wiring only:
// - empty state for no categories
// - subtitle update with active category filters
// - stable rendering for comments without categories
```

- [ ] **Step 4: Запустить целевой набор тестов**

Run: `cd front && bun test src/modules/keywords/components/__tests__/KeywordsTableCard.test.tsx src/modules/keywords/utils/__tests__/groupKeywordsByCategory.test.ts src/modules/comments/components/__tests__/CommentCategoryFilters.test.tsx src/modules/comments/components/__tests__/CommentCard.test.tsx src/modules/comments/components/__tests__/CommentsTableCard.integration.test.tsx src/modules/comments/utils/__tests__/getCommentCategories.test.ts src/modules/comments/utils/__tests__/filterCommentsByCategories.test.ts`

Expected: PASS.

- [ ] **Step 5: Прогнать линт изменённых фронтенд-файлов**

Run: `cd front && bun run lint`

Expected: PASS or only pre-existing unrelated issues.

- [ ] **Step 6: Закоммитить завершённую реализацию**

```bash
git add front/src/modules/comments/components/CommentsTableCard.tsx front/src/modules/keywords/components/KeywordsPage.tsx front/src/modules/comments/components/CommentsPage.tsx front/src/setupTests.ts
git commit -m "feat: добавлены категории словаря и теги категорий комментариев"
```
