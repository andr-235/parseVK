# Keywords Form Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Починить добавление ключевых слов и сделать комбинированное поле категории с выбором существующих значений и вводом новых.

**Architecture:** Использовать существующий поток данных формы и стор без изменений API. Подсказки категорий вычислять во view model и передавать в UI, а доступность кнопок определять напрямую по значениям инпутов.

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
