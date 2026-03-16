# Keywords Form Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Починить добавление ключевых слов и сделать комбинированное поле категории с выбором существующих значений и вводом новых.

**Architecture:** Использовать существующий поток данных формы и стор, но дополнить его явной синхронизацией списка после добавления и отдельным обновлением категории keyword. Подсказки категорий вычислять во view model и переиспользовать как в форме добавления, так и в инлайн-редактировании карточки.

**Tech Stack:** React, TypeScript, Vitest, Testing Library

---

## Chunk 1: Keywords Form

### Task 1: Добавить тесты на поведение формы

**Files:**
- Modify: `front/src/modules/keywords/components/__tests__/KeywordsForm.test.tsx`
- Test: `front/src/modules/keywords/components/__tests__/KeywordsForm.test.tsx`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**

### Task 2: Прокинуть подсказки категорий и disabled-состояния

**Files:**
- Modify: `front/src/modules/keywords/hooks/useKeywordsViewModel.ts`
- Modify: `front/src/modules/keywords/components/KeywordsPage.tsx`
- Modify: `front/src/modules/keywords/components/KeywordsForm.tsx`

- [ ] **Step 1: Add `categorySuggestions` to view model**
- [ ] **Step 2: Render `datalist` in form**
- [ ] **Step 3: Disable add buttons for empty trimmed values**
- [ ] **Step 4: Re-run targeted tests**

### Task 3: Исправить автосинхронизацию списка после добавления

**Files:**
- Modify: `front/src/modules/keywords/api/keywords.api.ts`
- Modify: `front/src/modules/keywords/store/keywordsStore.ts`
- Test: `front/src/modules/keywords/api/__tests__/keywords.api.test.ts`

- [ ] **Step 1: Write failing test for full list refresh behavior**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Fix keyword loading/update flow**
- [ ] **Step 4: Run targeted tests**

### Task 4: Добавить инлайн-редактирование категории keyword

**Files:**
- Modify: `api/src/keywords/keywords.controller.ts`
- Modify: `api/src/keywords/keywords.service.ts`
- Modify: `api/src/keywords/interfaces/keywords-repository.interface.ts`
- Modify: `api/src/keywords/repositories/keywords.repository.ts`
- Modify: `front/src/modules/keywords/api/keywords.api.ts`
- Modify: `front/src/modules/keywords/components/KeywordCard.tsx`
- Modify: `front/src/modules/keywords/components/KeywordCategorySection.tsx`
- Modify: `front/src/modules/keywords/hooks/useKeywordsViewModel.ts`

- [ ] **Step 1: Write failing backend/frontend tests**
- [ ] **Step 2: Add minimal update category API**
- [ ] **Step 3: Add inline edit mode on keyword card**
- [ ] **Step 4: Re-run targeted tests**

### Task 5: Проверить регрессию комментариев по категориям

**Files:**
- Modify: `front/src/modules/comments/hooks/useCommentsViewModel.ts`
- Modify: `front/src/modules/comments/utils/getCommentCategories.ts`
- Test: `front/src/modules/comments/**/__tests__/*`

- [ ] **Step 1: Reproduce category grouping regression with failing test**
- [ ] **Step 2: Fix grouping logic without side effects**
- [ ] **Step 3: Re-run targeted tests**
