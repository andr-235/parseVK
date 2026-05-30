# Чеклист завершения работы над страницей

## Токены и стили

- [ ] Все цвета — CSS-переменные (bg-background-*, text-text-*, border-border, accent-*)
- [ ] Нет хардкод-цветов: `#fff`, `#000`, `#xxxxxx`, `bg-slate-*`, `text-gray-*`
- [ ] Нет хардкод-размеров шрифта: `text-[10px]`, `text-[13px]` и т.д.
- [ ] Нет `transition-all` — только `transition-colors` / `transition-opacity`
- [ ] Типографика только через токены (font-monitoring-display, font-monitoring-body, font-mono-accent)
- [ ] Отступы и gap — через стандартные классы Tailwind (p-3, gap-3)

## Статусы

- [ ] Статусы вынесены в централизованный хелпер
- [ ] Цвета статусов — через accent-* токены (primary, success, warning, danger, info)
- [ ] Нет хардкод-цветов для статусов

## Компоненты

- [ ] Повторяющийся JSX вынесен в компоненты
- [ ] Массивы данных рендерятся через `.map()` (нет дублирования разметки)
- [ ] Компоненты имеют корректные TypeScript-интерфейсы
- [ ] Компоненты не превышают 100-150 строк без веской причины

## Доступность (a11y)

- [ ] Все кнопки: `type="button"`, `aria-label` если без текста
- [ ] Кликабельные элементы: `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space)
- [ ] Кастомные контролы: `role`, `aria-checked`/`aria-selected`
- [ ] ProgressBar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] DataTable: `aria-sort` на заголовках сортируемых колонок
- [ ] Модалы: `role="dialog"`, `aria-modal="true"`, Escape для закрытия
- [ ] Иконки: `aria-hidden="true"`

## Производительность

- [ ] Анимации только `transition-colors` / `transition-opacity`
- [ ] Нет анимации layout-свойств (width, height, padding, margin, border)
- [ ] Нет `animate-in fade-in` на контентных элементах

## Путь пользователя (UX)

- [ ] Loading state отображается (skeleton или спиннер)
- [ ] Empty state — понятное сообщение (не пустая страница)
- [ ] Error state — сообщение об ошибке
- [ ] Данные обновляются при навигации (useEffect cleanup)

## Проверки

- [ ] `tsc -b` — без ошибок
- [ ] `vite build` — успешно
- [ ] Страница рендерится в браузере / storybook
