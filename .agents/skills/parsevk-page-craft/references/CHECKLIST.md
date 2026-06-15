# Чеклист завершения работы над страницей

## Токены и стили

- [ ] Все цвета — CSS-переменные (bg-background-*, text-text-*, border-border, accent-*)
- [ ] Нет хардкод-цветов: `#fff`, `#000`, `#xxxxxx`, `bg-slate-*`, `text-gray-*`
- [ ] Нет хардкод-размеров шрифта: `text-[10px]`, `text-[13px]` и т.д.
- [ ] Нет `transition-all` — только `transition-colors` / `transition-opacity`
- [ ] Типографика только через токены (font-monitoring-display, font-monitoring-body, font-mono-accent)
- [ ] Отступы и gap — через стандартные классы Tailwind (p-3, gap-3)
- [ ] Карточки используют `rounded-card`, `shadow-soft-sm` / `shadow-soft-md`

## Статусы

- [ ] Статусы вынесены в централизованный хелпер
- [ ] Цвета статусов — через accent-* токены (primary, success, warning, danger, info)
- [ ] Нет хардкод-цветов для статусов

## Компоненты

- [ ] Повторяющийся JSX вынесен в компоненты
- [ ] Массивы данных рендерятся через `.map()` (нет дублирования разметки)
- [ ] Компоненты имеют корректные TypeScript-интерфейсы
- [ ] Компоненты не превышают 100-150 строк без веской причины
- [ ] Логические блоки выделены: header, results, row — отдельные компоненты

## Доступность (a11y)

- [ ] Все кнопки: `type="button"`, `aria-label` если без текста
- [ ] Кастомные `<button>` без `variant`: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30`
- [ ] Кликабельные элементы: `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space)
- [ ] Кастомные контролы: `role`, `aria-checked`/`aria-selected`
- [ ] ProgressBar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] DataTable: `aria-sort` на заголовках сортируемых колонок
- [ ] Модалы: `role="dialog"`, `aria-modal="true"`, Escape для закрытия
- [ ] Декоративные иконки: `aria-hidden="true"`
- [ ] Empty states: `role="region" aria-label="..."` (не `role="status"`)
- [ ] Скелетоны: `aria-busy="true" aria-label="Загрузка..."`
- [ ] Sentinel-элементы (пустые div для IntersectionObserver): `aria-hidden="true"`

## Производительность

- [ ] Анимации только `transition-colors` / `transition-opacity`
- [ ] Нет анимации layout-свойств (width, height, padding, margin, border)
- [ ] Нет `animate-in fade-in` на контентных элементах
- [ ] Изображения: `loading="lazy"` для оффскрин
- [ ] `React.memo` на компонентах в списках (card, row)

## Путь пользователя (UX)

- [ ] Loading state: skeleton-сетка (повторяющая структуру карточек)
- [ ] Empty state: понятное сообщение с иконкой (не пустая страница)
- [ ] Error state: сообщение об ошибке с accent-danger
- [ ] No-results state (есть фильтр/поиск, но ничего не найдено)
- [ ] Destructive actions: подтверждение (two-click или confirm диалог)
- [ ] Обратная связь: toast после мутаций (добавление, удаление)
- [ ] Collapsible секции: Escape закрывает
- [ ] Данные обновляются при навигации (useEffect cleanup)

## Touch / Mobile

- [ ] Кнопки минимум `h-9` (36px), в идеале `h-10` (40px)
- [ ] Нет кнопок `h-7` (28px) или `size-7` — слишком малы для touch
- [ ] Интерактивные элементы на мобилке: min 44x44pt target size

## Проверки

- [ ] `tsc -b` — без ошибок
- [ ] `vite build` — успешно
- [ ] Страница рендерится в браузере / storybook
