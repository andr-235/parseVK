---
target: front/src/pages (все страницы)
total_score: 21
p0_count: 2
p1_count: 4
p2_count: 2
p3_count: 2
timestamp: 2026-05-29T13-03-31Z
slug: front-src-pages
---
# Design Critique: parseVK Pages (20 страниц)

**Target**: `front/src/pages` — все 20 страниц дашборда социальной аналитики
**Register**: Product (SaaS-инструмент для аналитиков)
**Date**: 2026-05-28

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton loaders и spin-to-refresh хороши, но `window.confirm()` и отсутствие toast для операций удаления |
| 2 | Match System / Real World | 3 | Русские лейблы точны и доменно-корректны; LoginPage/ChangePasswordPage используют неконсистентный брендинг |
| 3 | User Control and Freedom | 2 | Нет undo для деструктивных действий. `window.confirm()` в 2+ страницах. Нет breadcrumbs |
| 4 | Consistency and Standards | 2 | Системный разрыв `primary` vs `accent-primary`. 4 страницы с хардкодными цветами. Разные max-width |
| 5 | Error Prevention | 2 | Валидация пароля есть, но field-level validation отсутствует. Нет autosave. `window.confirm()` на удаление |
| 6 | Recognition Rather Than Recall | 3 | Чёткие лейблы разделов, иконка+текст везде. Но icon-only кнопки в Authors на `title` без видимых лейблов |
| 7 | Flexibility and Efficiency | 1 | Нет клавиатурных шорткатов. Нет bulk-select/batch-edit. Нет кастомизации (кроме density toggle) |
| 8 | Aesthetic and Minimalist Design | 2 | Токен-страницы хороши. Но ChangePasswordPage с floating particles, градиентные разделители на 9+ страницах |
| 9 | Help Users Recognize, from Errors | 2 | ErrorState с retry — хороший паттерн. Но ошибки везде generic "Не удалось загрузить". Нет field-level ошибок |
| 10 | Help and Documentation | 1 | Нет документации, contextual help, туров, FAQ. Только placeholder-тексты и 1 info callout в Settings |
| **Total** | | **21/40** | **Acceptable** |

---

## Anti-Patterns Verdict

**LLM assessment**: Это серьёзный тёмный SaaS-инструмент с архитектурной дисциплиной на 16 из 20 страниц. Но 4 страницы-аутсайдера (MetricsPage, ChangePasswordPage, TelegramDlUploadPage, TgmbaseSearchPage) используют хардкодные цвета, и системный разрыв `primary` vs `accent-primary` присутствует на ~50% страниц. Общее впечатление: инструмент, который боролся с техническим долгом и местами проиграл.

**Deterministic scan**: Недоступен — детектор не встроен в проект. Ручной обзор кода заменил автоматическую проверку.

---

## Overall Impression

Серьёзный тёмный SaaS-инструмент с настоящей структурной дисциплиной — паттерн PageHeader + карточная сетка, семантические цвета и покрытие состояний загрузки показывают продуманный дизайн. Но приложение ведёт войну на два фронта: гигиена токенов (primary/accent-primary путаница, 4 хардкодные страницы) и декоративный осадок (частицы, градиентные линии, 500ms stagger-анимации), подрывающие спокойную консольную эстетику.

---

## What's Working

1. **Унифицированный PageHeader с карточной сеткой** — самый сильный паттерн консистентности, используемый на 18/20 страниц. Создаёт единый ритм входа на страницу.

2. **Отличное покрытие Empty/Loading/Error состояний** с осмысленными сообщениями и кнопками retry (MonitoringPage, GroupsPage, KeywordsPage, WatchlistPage). Аналитики всегда знают, что пошло не так.

3. **Семантическая цветовая система** (`accent-success`, `accent-danger`, `accent-warning`, `accent-info`) последовательно используется для статусных бейджей. Создаёт надёжные пути сканирования.

4. **Плотные, но читаемые таблицы и карточные макеты** с правильной типографической иерархией — DataTable в AuthorsPage с 10 колонками остаётся сканируемой.

---

## Priority Issues

### [P0] MetricsPage полностью оторвана от дизайн-системы
- **Что**: Использует хардкодные `text-slate-400`, `bg-slate-800`, `border-slate-700/60`, сырой `<button>` вместо `<Button>`, не использует PageHeader/PageContainer (566 строк).
- **Почему критично**: Создаёт визуально разрозненную страницу, которая ломает весь дизайн-системный контракт. Аналитики теряют уверенность, когда один экран выглядит как другой продукт.
- **Fix**: Заменить все `slate-*` классы на дизайн-токены. Мигрировать хедер на PageHeader. Заменить `<button>` на `<Button>`.
- **Команда**: `distill`

### [P0] ChangePasswordPage с floating particles и хардкодными цветами
- **Что**: Хардкодные `border-[#2a2a30]`, `bg-[#1c1c21]`, `text-zinc-100`, и 20 анимированных floating particles (`animate-float`). Дублирует LoginPage с другими токенами.
- **Почему критично**: Анимированные частицы прямо нарушают DESIGN.md ("декоративная анимация, не передающая состояние"). Хардкодные цвета будут дрифтовать.
- **Fix**: Удалить floating particles (строки 88-101) и `<style>` блок (275-294). Заменить цвета на токены. Выровнять с LoginPage.
- **Команда**: `polish`

### [P1] Систематическая путаница `primary` vs `accent-primary`
- **Что**: MonitoringPage, KeywordsPage, GroupsPage используют `via-primary/50`, а TasksPage, SettingsPage — `via-accent-primary/5`.
- **Почему критично**: Если `primary` и `accent-primary` резолвятся в один CSS-вариабл — дублирование создаёт путаницу при поддержке. Если в разные — часть страниц рендерится с другим акцентным цветом.
- **Fix**: Аудит всех Tailwind-классов на всех 20 страницах. Стандартизировать на одном имени.
- **Команда**: `audit`

### [P1] TelegramDlUploadPage (1161 строк) полностью на хардкодных цветах
- **Что**: `bg-slate-800/30`, `text-rose-300`, `text-amber-300`, `bg-white/[0.03]`, `border-rose-400/20`.
- **Почему критично**: Самая большая страница в приложении полностью отключена от системы токенов. Будет сопротивляться темизации.
- **Fix**: Заменить все хардкодные цвета на системные токены. В первую очередь — статусные бейджи, бордеры секций, фоны таблиц.
- **Команда**: `distill`

### [P1] TgmbaseSearchPage на хардкодных slate/rose
- **Что**: `text-slate-200`, `bg-[#131316]`, `bg-slate-800`, `border-rose-400/20`.
- **Почему критично**: Третья большая страница с хардкодной slate-палитрой. Та же проблема цветового дрифта.
- **Fix**: Заменить на `text-text-primary`, `bg-background-secondary`, `border-accent-danger/20`.
- **Команда**: `distill`

### [P1] PageHeader `variant='hero'` в AuthorAnalysisPage не работает
- **Что**: AuthorAnalysisPage использует `variant='hero'` на PageHeader, но PageHeader.tsx явно игнорирует variant (комментарий "Игнорируем, так как теперь всегда console").
- **Почему критично**: Баг: intended hero-оформление не применяется. Мёртвый код в компоненте.
- **Fix**: Либо реализовать `variant='hero'`, либо убрать его из AuthorAnalysisPage.
- **Команда**: `clarify`

### [P2] Нет клавиатурных шорткатов
- **Что**: Ни одна из 20 страниц не имеет клавиатурных шорткатов.
- **Почему критично**: Аналитики (Alex-персона) работают повторяющимися сессиями. Отсутствие шорткатов замедляет ежедневные рабочие процессы.
- **Fix**: Как минимум: `Ctrl+Enter` для поиска, `n` для нового элемента, `r` для refresh, `/` для фокуса поиска, `Escape` для закрытия модалок.
- **Команда**: `harden`

### [P2] `window.confirm()` вместо кастомного ConfirmDialog
- **Что**: AdminUsersPage и WatchlistPage используют браузерный `window.confirm()` для подтверждения удаления.
- **Почему критично**: Ломает погружение в консоль. Нет брендирования, детального сообщения, управления фокусом.
- **Fix**: Заменить на кастомный ConfirmDialog на Radix AlertDialog.
- **Команда**: `polish`

### [P3] Градиентные разделители секций на 9+ страницах
- **Что**: `from-transparent via-primary/50 to-transparent` используется как декоративный разделитель между секциями.
- **Почему**: Product.md запрещает декоративные элементы, не передающие состояние. Эти градиенты — визуальный шум.
- **Fix**: Заменить на простые `border-border/30` горизонтальные линии.
- **Команда**: `distill`

### [P3] Staggered-анимации 500ms на MonitoringPage
- **Что**: 5 уровней задержки (100-500ms) для последовательного появления секций.
- **Почему**: 500ms задержек перед тем, как пользователь может взаимодействовать с нижними секциями. DESIGN.md говорит "150-250ms".
- **Fix**: Сократить до макс 3 шагов через 200ms, или убрать page-level обёртку.
- **Команда**: `polish`

---

## Persona Red Flags

### Alex (Power User)
- Нет клавиатурных шорткатов ни на одной странице — каждое действие требует клика
- Нет bulk-select или batch-edit в списках (Authors, Groups, Keywords, Tasks)
- `window.confirm()` на удаление — лишний клик
- 500ms stagger-анимации на MonitoringPage замедляют triage
- Нет command palette (Ctrl+K) для навигации между 20 страницами

### Jordan (First-Timer)
- Технические термины (`chat_id`, `peer_id`, `telegramId`) без inline-объяснений
- Empty states варьируются по качеству — MonitoringPage даёт action guide, WatchlistPage — generic "list is empty"
- Нет кнопки помощи или значка вопроса

### Sam (Accessibility)
- 4 хардкодные страницы могут не уважать forced color schemes
- `window.confirm()` — нестилизуемый, с непредсказуемым фокусом
- Icon-only кнопки в AuthorsTableCard с `title` без видимых accessible-лейблов
- Floating particles в ChangePasswordPage — отвлекающие, неконтролируемые для screen reader

### Riley (Stress Tester)
- Хардкодные страницы рендерятся иначе, чем токеновые — визуальное поведение неконсистентно
- `window.confirm()` не даёт отменить случайный клик
- Нет гарантий сохранения данных — рефреш mid-operation может потерять состояние

### Casey (Mobile)
- Приложение оптимизировано под десктоп — плотные таблицы с 10+ колонками не touch-friendly
- Staggered-анимации увеличивают время загрузки на медленных соединениях
- Floating particles потребляют CPU на энергоограниченных устройствах
- Формы с 10+ полями требуют скролла на мобильных

---

## Minor Observations

- KeywordsPage `KeywordCard` использует `hover:shadow-md transition-shadow` — DESIGN.md говорит, что shadows для разделения, не для hover-декора
- MonitoringPage использует `max-w-400` (1024px), а большинство других — `max-w-[1600px]` через PageContainer — неконсистентная ширина контента
- CommentsPage использует `variant='badges'` на PageHeader — другой паттерн заголовка, чем `variant='grid'` или `variant='hero'`
- GroupsPage `PageHeader variant='simple'` — ещё один мёртвый variant (PageHeader игнорирует этот проп)
- SettingsPage использует CardHeader/Title/Description из Radix для внутренних AutomationCard/TelegramCard — две карточные системы на одной странице
- VkFriendsExportPage и OkFriendsExportPage используют `ExportPageTemplate` — чисто, но PageHeader уже поддерживает platformLabel/apiMethod
- ListingsPage и AdminUsersPage используют raw `<select>` с разными стилями — неконсистентно
- WatchlistPage: частичное использование токенов — `text-slate-400` в кастомном контенте при правильных токенах в PageHeader

---

## Questions to Consider

1. Должен ли быть `primary` и `accent-primary` один канонический Tailwind-цвет или два? Если один — почему 50% страниц используют один, а 50% — другой?
2. PageHeader `variant` prop — мёртвый код или незавершённая фича? Стоит ли удалить все variant, кроме рабочего?
3. Какова стратегия обратной совместимости при миграции 4 хардкодных страниц на токены?
4. Стоит ли 20 страницам использовать единую константу max-width, или разные типы страниц (мониторинг, таблицы, формы) действительно требуют разной ширины?
5. Стоит ли `animate-in` + staggered delay для операторской консоли, или удалить полностью ради скорости?
