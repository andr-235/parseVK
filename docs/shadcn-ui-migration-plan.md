# План миграции компонентов на shadcn/ui

## Исходные данные

- Стек: React + Vite
- Страницы: AdminUsers, AuthorAnalysis, Authors, ChangePassword, Comments, Groups, Keywords, Listings, Login, Metrics, Settings, Tasks, Telegram, Watchlist
- Принцип учета: количество экземпляров — это точки использования в коде по дереву компонентов; каждый компонентный файл учитывается один раз; циклы и динамические рендеры не развернуты
- Примечание: встретились native элементы (button/input/select/label/table); они учтены и помечены в инвентаризации
- Примечание: компоненты «и т.д.» требуют дополнительной детализации после финального аудита всех страниц и модулей

## Фаза 1: Подготовка

- [ ] Установить и проверить shadcn/ui под React + Vite (aliases, tailwind, css variables)
- [ ] Настроить тему и дизайн‑токены (цвета, радиусы, типографика)
- [ ] Сформировать базовую структуру компонентов и соглашения по вариантам
- [ ] Ввести временный слой совместимости для параллельного существования старых и новых компонентов
- [ ] Завершить аудит `front/src` и зафиксировать список дополнительных UI‑компонентов

## Фаза 2: Миграция по типам компонентов

### Этап 1 — Атомарные компоненты

### Неделя 1: Кнопки (Button)

**Страницы с использованием:** AdminUsers, AuthorAnalysis, Authors, ChangePassword, Comments, Groups, Keywords, Listings, Login, Metrics, Settings, Tasks, Telegram, Watchlist
**Количество экземпляров:** 117
**Варианты:** variant: default, destructive, ghost, outline, secondary; size: icon, lg, sm

- [ ] Нормализовать варианты и размеры Button
- [ ] Заменить native button на shadcn Button
- [ ] Обновить кнопки действий в таблицах и карточках
- [ ] Провести визуальную и функциональную проверку

### Неделя 2: Инпуты (Input)

**Страницы с использованием:** AdminUsers, Authors, ChangePassword, Comments, Groups, Keywords, Listings, Login, Settings, Tasks, Telegram, Watchlist
**Количество экземпляров:** 50
**Варианты:** type: file, number, password, tel, text, time

- [ ] Унифицировать Input и состояния (focus/disabled/error)
- [ ] Привести типы инпутов к стандарту
- [ ] Заменить native input на shadcn Input, кроме file
- [ ] Проверить формы и валидацию

### Неделя 3: Label

**Страницы с использованием:** AdminUsers, ChangePassword, Groups, Listings, Login, Settings, Telegram
**Количество экземпляров:** 28
**Варианты:** —

- [ ] Зафиксировать правила Label + Input/Select (htmlFor, a11y)
- [ ] Заменить native label на shadcn Label
- [ ] Проверить формы на доступность

### Неделя 4: Badge

**Страницы с использованием:** AdminUsers, AuthorAnalysis, Comments, Groups, Keywords, Settings, Tasks, Telegram, Watchlist
**Количество экземпляров:** 40
**Варианты:** variant: destructive, outline, secondary

- [ ] Зафиксировать варианты статусов и их семантику
- [ ] Привести бейджи в таблицах и карточках к единым стилям
- [ ] Проверить контраст и читаемость

### Этап 2 — Компоненты выбора

### Неделя 5: Select

**Страницы с использованием:** AdminUsers, Listings
**Количество экземпляров:** 5
**Варианты:** native select обнаружен

- [ ] Перевести native select на shadcn Select
- [ ] Уточнить placeholder и состояние disabled
- [ ] Проверить формы фильтров

### Неделя 6: Checkbox

**Страницы с использованием:** Groups, Listings, Settings
**Количество экземпляров:** 5
**Варианты:** сейчас через input[type=checkbox]

- [ ] Заменить checkbox‑инпуты на shadcn Checkbox
- [ ] Привести размеры и отступы к стандарту
- [ ] Проверить a11y и кликабельность меток

### Неделя 7: Radio Group

**Страницы с использованием:** —
**Количество экземпляров:** 0
**Варианты:** —

- [ ] Подготовить компонент на будущее
- [ ] Внедрять при появлении сценариев выбора одного значения

### Неделя 8: Switch

**Страницы с использованием:** —
**Количество экземпляров:** 0
**Варианты:** —

- [ ] Проверить настройки на наличие кастомных тумблеров
- [ ] При обнаружении заменить на shadcn Switch

### Этап 3 — Компоненты отображения данных

### Неделя 9: Card

**Страницы с использованием:** AdminUsers, AuthorAnalysis, Authors, ChangePassword, Comments, Groups, Keywords, Listings, Login, Metrics, Settings, Tasks, Telegram, Watchlist
**Количество экземпляров:** 39
**Варианты:** custom wrappers присутствуют (PageHeroCard, SectionCard, \*Card)

- [ ] Привести кастомные Card‑обертки к shadcn Card primitives
- [ ] Зафиксировать варианты карточек (hero/section/glassmorphic)
- [ ] Проверить сетки и отступы

### Неделя 10: Table

**Страницы с использованием:** AdminUsers, Authors, Comments, Groups, Keywords, Tasks, Telegram, Watchlist
**Количество экземпляров:** 12
**Варианты:** TableCard‑обертки в Authors/Comments/Groups/Keywords/Watchlist

- [ ] Привести таблицы к единому API (shadcn Table)
- [ ] Унифицировать колонки действий и статусы
- [ ] Проверить пустые состояния и сортировки

### Неделя 11: Avatar

**Страницы с использованием:** Authors, Comments
**Количество экземпляров:** 2
**Варианты:** —

- [ ] Проверить размеры и fallback‑инициалы
- [ ] Согласовать применение в таблицах и карточках

### Неделя 12: Separator

**Страницы с использованием:** Comments, Tasks
**Количество экземпляров:** 3
**Варианты:** —

- [ ] Унифицировать толщину и отступы
- [ ] Проверить разделители в списках и карточках

### Этап 4 — Сложные интерактивные компоненты

### Неделя 13: Dialog/Modal

**Страницы с использованием:** Comments, Listings, Tasks
**Количество экземпляров:** 5
**Варианты:** custom modals (CreateParseTaskModal, Export/Import/EditListingsModal, PostPreviewModal)

- [ ] Перевести кастомные модалки на shadcn Dialog
- [ ] Унифицировать размеры и заголовки
- [ ] Проверить формы внутри модалок

### Неделя 14: Dropdown Menu

**Страницы с использованием:** Groups, Keywords, Tasks
**Количество экземпляров:** 4
**Варианты:** —

- [ ] Свести дропдауны к единому паттерну
- [ ] Проверить доступность и управление с клавиатуры

### Неделя 15: Popover

**Страницы с использованием:** —
**Количество экземпляров:** 0
**Варианты:** —

- [ ] Подготовить компонент на будущее
- [ ] Внедрять при появлении сценариев

### Неделя 16: Tooltip

**Страницы с использованием:** Comments, Listings
**Количество экземпляров:** 2
**Варианты:** —

- [ ] Унифицировать подсказки и задержки
- [ ] Проверить читаемость и контраст

## Фаза 3: Постраничная инвентаризация

Примечание: таблицы ниже показывают точки использования компонентов в коде и связанные обертки. Для динамических списков фактическое число инстансов может быть выше.

### Страница: AdminUsers

| Компонент | Количество     | Варианты/типы                             | Зависимости/примечания                              |
| --------- | -------------- | ----------------------------------------- | --------------------------------------------------- |
| Button    | 5              | variant: ghost, secondary; size: sm       | Действия в формах и таблицах; связан с Input/Select |
| Input     | 3              | type: password                            | Связан с Label и валидацией; native input: 1        |
| Select    | 1              | native select                             | Связан с Label и списком опций; native select: 1    |
| Label     | 3              | —                                         | Связан с Input/Select                               |
| Badge     | 2              | variant: outline                          | Статусы; часто в таблицах и карточках               |
| Card      | 3 + 3 wrappers | wrappers: PageHeroCard(1), SectionCard(2) | Контейнер секций; внутри Button/Input/Table         |
| Table     | 1              | —                                         | Действия через Button/Dropdown; статусы через Badge |

### Страница: AuthorAnalysis

| Компонент | Количество     | Варианты/типы                                                   | Зависимости/примечания                              |
| --------- | -------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| Button    | 6              | variant: destructive, outline; size: sm                         | Действия в формах и таблицах; связан с Input/Select |
| Badge     | 9              | variant: destructive, outline                                   | Статусы; часто в таблицах и карточках               |
| Card      | 3 + 4 wrappers | wrappers: PageHeroCard(1), PhotoAnalysisCard(1), SectionCard(2) | Контейнер секций; внутри Button/Input/Table         |

### Страница: Authors

| Компонент | Количество     | Варианты/типы                                        | Зависимости/примечания                                                |
| --------- | -------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| Button    | 7              | variant: destructive, ghost, outline; size: icon, sm | Действия в формах и таблицах; связан с Input/Select; native button: 1 |
| Input     | 2              | —                                                    | Связан с Label и валидацией; native input: 1                          |
| Card      | 1 + 1 wrappers | wrappers: PageHeroCard(1)                            | Контейнер секций; внутри Button/Input/Table                           |
| Table     | 1 + 1 wrappers | wrappers: AuthorsTableCard(1)                        | Действия через Button/Dropdown; статусы через Badge                   |
| Avatar    | 1              | —                                                    | Данные пользователя/автора                                            |

### Страница: ChangePassword

| Компонент | Количество | Варианты/типы  | Зависимости/примечания                              |
| --------- | ---------- | -------------- | --------------------------------------------------- |
| Button    | 1          | —              | Действия в формах и таблицах; связан с Input/Select |
| Input     | 4          | type: password | Связан с Label и валидацией; native input: 1        |
| Label     | 3          | —              | Связан с Input/Select                               |
| Card      | 1          | —              | Контейнер секций; внутри Button/Input/Table         |

### Страница: Comments

| Компонент    | Количество     | Варианты/типы                                               | Зависимости/примечания                                                |
| ------------ | -------------- | ----------------------------------------------------------- | --------------------------------------------------------------------- |
| Button       | 16             | variant: ghost, outline; size: icon, sm                     | Действия в формах и таблицах; связан с Input/Select; native button: 1 |
| Input        | 2              | —                                                           | Связан с Label и валидацией; native input: 1                          |
| Badge        | 11             | variant: outline, secondary                                 | Статусы; часто в таблицах и карточках                                 |
| Card         | 3 + 4 wrappers | wrappers: CommentCard(2), PageHeroCard(1), PostGroupCard(1) | Контейнер секций; внутри Button/Input/Table                           |
| Table        | 0 + 1 wrappers | wrappers: CommentsTableCard(1)                              | Действия через Button/Dropdown; статусы через Badge                   |
| Dialog/Modal | 0 + 1 modals   | modals: PostPreviewModal                                    | Открывается Button; внутри Input/Select                               |
| Tooltip      | 1              | —                                                           | Привязан к Button/Icon                                                |
| Avatar       | 1              | —                                                           | Данные пользователя/автора                                            |
| Separator    | 2              | —                                                           | Разделение секций                                                     |

### Страница: Groups

| Компонент    | Количество     | Варианты/типы                                                         | Зависимости/примечания                                                |
| ------------ | -------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Button       | 16             | variant: destructive, ghost, outline, secondary; size: icon, sm       | Действия в формах и таблицах; связан с Input/Select; native button: 1 |
| Input        | 6              | type: file, text                                                      | Связан с Label и валидацией; native input: 4                          |
| Checkbox     | 2              | type: checkbox (native)                                               | Состояния форм; связан с Label; заменить на Checkbox                  |
| Label        | 1              | —                                                                     | Связан с Input/Select; native label: 1                                |
| Badge        | 2              | variant: secondary                                                    | Статусы; часто в таблицах и карточках                                 |
| Card         | 4 + 3 wrappers | wrappers: GroupCard(1), RegionGroupCard(1), RegionGroupsSearchCard(1) | Контейнер секций; внутри Button/Input/Table                           |
| Table        | 0 + 1 wrappers | wrappers: GroupsTableCard(1)                                          | Действия через Button/Dropdown; статусы через Badge                   |
| DropdownMenu | 2              | —                                                                     | Триггерится Button; часто в таблицах                                  |

### Страница: Keywords

| Компонент    | Количество     | Варианты/типы                     | Зависимости/примечания                                                |
| ------------ | -------------- | --------------------------------- | --------------------------------------------------------------------- |
| Button       | 7              | variant: ghost, outline; size: sm | Действия в формах и таблицах; связан с Input/Select; native button: 1 |
| Input        | 6              | type: file, text                  | Связан с Label и валидацией; native input: 2                          |
| Badge        | 3              | variant: outline, secondary       | Статусы; часто в таблицах и карточках                                 |
| Card         | 3 + 1 wrappers | wrappers: KeywordCard(1)          | Контейнер секций; внутри Button/Input/Table                           |
| Table        | 0 + 1 wrappers | wrappers: KeywordsTableCard(1)    | Действия через Button/Dropdown; статусы через Badge                   |
| DropdownMenu | 1              | —                                 | Триггерится Button; часто в таблицах                                  |

### Страница: Listings

| Компонент    | Количество     | Варианты/типы                                                      | Зависимости/примечания                                                |
| ------------ | -------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Button       | 22             | variant: ghost, outline, secondary; size: sm                       | Действия в формах и таблицах; связан с Input/Select; native button: 9 |
| Input        | 6              | type: file                                                         | Связан с Label и валидацией; native input: 4                          |
| Checkbox     | 2              | type: checkbox (native)                                            | Состояния форм; связан с Label; заменить на Checkbox                  |
| Select       | 4              | native select                                                      | Связан с Label и списком опций; native select: 4                      |
| Label        | 5              | —                                                                  | Связан с Input/Select; native label: 5                                |
| Card         | 1 + 2 wrappers | wrappers: ListingCard(1), MotionCard(1)                            | Контейнер секций; внутри Button/Input/Table                           |
| Dialog/Modal | 0 + 3 modals   | modals: EditListingModal, ExportListingsModal, ImportListingsModal | Открывается Button; внутри Input/Select                               |
| Tooltip      | 1              | —                                                                  | Привязан к Button/Icon                                                |

### Страница: Login

| Компонент | Количество | Варианты/типы  | Зависимости/примечания                              |
| --------- | ---------- | -------------- | --------------------------------------------------- |
| Button    | 5          | variant: ghost | Действия в формах и таблицах; связан с Input/Select |
| Input     | 7          | type: password | Связан с Label и валидацией; native input: 1        |
| Label     | 6          | —              | Связан с Input/Select                               |
| Card      | 1          | —              | Контейнер секций; внутри Button/Input/Table         |

### Страница: Metrics

| Компонент | Количество | Варианты/типы | Зависимости/примечания                                                |
| --------- | ---------- | ------------- | --------------------------------------------------------------------- |
| Button    | 1          | —             | Действия в формах и таблицах; связан с Input/Select; native button: 1 |
| Card      | 6          | —             | Контейнер секций; внутри Button/Input/Table                           |

### Страница: Settings

| Компонент | Количество     | Варианты/типы                                                 | Зависимости/примечания                               |
| --------- | -------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| Button    | 3              | variant: default, secondary; size: sm                         | Действия в формах и таблицах; связан с Input/Select  |
| Input     | 7              | type: number, tel, time                                       | Связан с Label и валидацией; native input: 2         |
| Checkbox  | 1              | type: checkbox (native)                                       | Состояния форм; связан с Label; заменить на Checkbox |
| Label     | 6              | —                                                             | Связан с Input/Select                                |
| Badge     | 1              | —                                                             | Статусы; часто в таблицах и карточках                |
| Card      | 3 + 3 wrappers | wrappers: AutomationCard(1), PageHeroCard(1), TelegramCard(1) | Контейнер секций; внутри Button/Input/Table          |

### Страница: Tasks

| Компонент    | Количество   | Варианты/типы                                      | Зависимости/примечания                                                |
| ------------ | ------------ | -------------------------------------------------- | --------------------------------------------------------------------- |
| Button       | 12           | variant: ghost, outline, secondary; size: icon, lg | Действия в формах и таблицах; связан с Input/Select; native button: 4 |
| Input        | 1            | type: text                                         | Связан с Label и валидацией; native input: 1                          |
| Badge        | 3            | variant: outline                                   | Статусы; часто в таблицах и карточках                                 |
| Card         | 4            | —                                                  | Контейнер секций; внутри Button/Input/Table                           |
| Table        | 1            | —                                                  | Действия через Button/Dropdown; статусы через Badge; native table: 1  |
| Dialog/Modal | 0 + 1 modals | modals: CreateParseTaskModal                       | Открывается Button; внутри Input/Select                               |
| DropdownMenu | 1            | —                                                  | Триггерится Button; часто в таблицах                                  |
| Separator    | 1            | —                                                  | Разделение секций                                                     |

### Страница: Telegram

| Компонент | Количество     | Варианты/типы                                                                 | Зависимости/примечания                              |
| --------- | -------------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| Button    | 7              | variant: outline; size: sm                                                    | Действия в формах и таблицах; связан с Input/Select |
| Input     | 5              | type: password                                                                | Связан с Label и валидацией; native input: 1        |
| Label     | 4              | —                                                                             | Связан с Input/Select; native label: 4              |
| Badge     | 5              | variant: outline                                                              | Статусы; часто в таблицах и карточках               |
| Card      | 4 + 3 wrappers | wrappers: TelegramMembersCard(1), TelegramSessionCard(1), TelegramSyncCard(1) | Контейнер секций; внутри Button/Input/Table         |
| Table     | 1              | —                                                                             | Действия через Button/Dropdown; статусы через Badge |

### Страница: Watchlist

| Компонент | Количество      | Варианты/типы                                     | Зависимости/примечания                                                |
| --------- | --------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| Button    | 9               | variant: destructive, ghost, outline; size: sm    | Действия в формах и таблицах; связан с Input/Select; native button: 2 |
| Input     | 1               | type: text                                        | Связан с Label и валидацией; native input: 1                          |
| Badge     | 4               | variant: outline, secondary                       | Статусы; часто в таблицах и карточках                                 |
| Card      | 2 + 11 wrappers | wrappers: SectionCard(1), WatchlistAuthorCard(10) | Контейнер секций; внутри Button/Input/Table                           |
| Table     | 3 + 1 wrappers  | wrappers: WatchlistTableCard(1)                   | Действия через Button/Dropdown; статусы через Badge; native table: 1  |

## Фаза 4: План замены по страницам

### Страница: AdminUsers

- Порядок замены: Button/Input/Label/Select/Badge → Table → Card
- Оценка времени: 1–1.5 дня
- Потенциальные риски: икон‑кнопки в таблице и native select
- Кастомные варианты: Badge.outline, Button size sm

### Страница: AuthorAnalysis

- Порядок замены: Button/Badge → Card → остальное
- Оценка времени: 1–1.5 дня
- Потенциальные риски: нестандартные бейджи уровней подозрений
- Кастомные варианты: Badge destructive/outline

### Страница: Authors

- Порядок замены: Input/Button → Table → Card/Avatar
- Оценка времени: 1 день
- Потенциальные риски: икон‑кнопки и аватары в таблице
- Кастомные варианты: Button destructive/outline/ghost; size icon/sm

### Страница: ChangePassword

- Порядок замены: Input/Label → Button → Card
- Оценка времени: 0.5 дня
- Потенциальные риски: валидация и состояния ошибок
- Кастомные варианты: нет

### Страница: Comments

- Порядок замены: Input/Button/Badge → Tooltip → Card/Table‑wrappers → Modal
- Оценка времени: 1.5–2 дня
- Потенциальные риски: модалка предпросмотра и сложные карточки комментариев
- Кастомные варианты: Button size icon/sm; Badge outline/secondary

### Страница: Groups

- Порядок замены: Input/Button/Badge → DropdownMenu → Card/Table‑wrappers → Checkbox
- Оценка времени: 1.5–2 дня
- Потенциальные риски: много форм и file‑input, чекбоксы
- Кастомные варианты: Button destructive/outline/ghost/secondary; input file/checkbox

### Страница: Keywords

- Порядок замены: Input/Button/Badge → DropdownMenu → Card/Table‑wrappers
- Оценка времени: 1–1.5 дня
- Потенциальные риски: file‑input и кастомные карточки
- Кастомные варианты: Button ghost/outline; input file

### Страница: Listings

- Порядок замены: Input/Select/Button → Tooltip → Card → Modal
- Оценка времени: 1.5–2 дня
- Потенциальные риски: три модалки и формы внутри
- Кастомные варианты: Button ghost/outline/secondary; native select

### Страница: Login

- Порядок замены: Input/Label → Button → Card
- Оценка времени: 0.5–1 день
- Потенциальные риски: glassmorphic стили карточки
- Кастомные варианты: Button ghost; glassmorphic Card

### Страница: Metrics

- Порядок замены: Button → Card
- Оценка времени: 0.5 дня
- Потенциальные риски: минимальные риски
- Кастомные варианты: native button

### Страница: Settings

- Порядок замены: Input/Label/Button/Badge → Card → Checkbox
- Оценка времени: 1 день
- Потенциальные риски: много типов инпутов и скрытые зависимости
- Кастомные варианты: Button default/secondary; input number/tel/time/checkbox

### Страница: Tasks

- Порядок замены: Button/Badge/Input → DropdownMenu → Card/Table → Modal
- Оценка времени: 1.5–2 дня
- Потенциальные риски: модалка создания и таблица/список задач
- Кастомные варианты: Button size lg/icon; DropdownMenu actions

### Страница: Telegram

- Порядок замены: Input/Label/Button/Badge → Card → Table
- Оценка времени: 1 день
- Потенциальные риски: синхронизация и таблица участников
- Кастомные варианты: Button outline; Badge outline

### Страница: Watchlist

- Порядок замены: Button/Badge/Input → Table → Card
- Оценка времени: 1.5 дня
- Потенциальные риски: виртуализированная таблица и состояния кнопок
- Кастомные варианты: Button outline/destructive; Badge outline/secondary

## Фаза 5: Тестирование и валидация

- [ ] Визуальное тестирование каждого компонента и страниц
- [ ] Проверка функциональности (формы, таблицы, модалки)
- [ ] Тестирование адаптивности (mobile/tablet/desktop)
- [ ] Проверка доступности (a11y, фокус, контраст)

## Фаза 6: Финальная оптимизация

- [ ] Удалить устаревшие компоненты после перехода
- [ ] Оптимизировать импорты и алиасы
- [ ] Документировать новые компоненты и варианты
- [ ] Storybook или аналог (опционально)
