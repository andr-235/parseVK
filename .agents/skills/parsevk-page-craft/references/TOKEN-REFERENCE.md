# Design Token Reference

## Цвета (из CssVariables)

| Токен | Переменная | Назначение |
|---|---|---|
| `bg-background-primary` | `--color-background-primary` | Основной фон страницы |
| `bg-background-secondary` | `--color-background-secondary` | Фон карточек, панелей |
| `bg-background-sidebar` | `--color-background-sidebar` | Фон сайдбара |
| `bg-background-elevated` | `--color-background-elevated` | Фон модальных окон, дропдаунов |
| `bg-background-overlay` | `--color-background-overlay` | Затемнение под модалками |
| `text-text-primary` | `--color-text-primary` | Основной текст |
| `text-text-secondary` | `--color-text-secondary` | Вторичный текст |
| `text-text-light` | `--color-text-light` | Заголовки |
| `text-accent-primary` | `--color-accent-primary` | Акцент (голубой) |
| `text-accent-success` | `--color-accent-success` | Успех (зелёный) |
| `text-accent-warning` | `--color-accent-warning` | Предупреждение (жёлтый) |
| `text-accent-danger` | `--color-accent-danger` | Ошибка (красный) |
| `text-accent-info` | `--color-accent-info` | Инфо (синий) |
| `border-border` | `--color-border` | Границы |
| `border-border/50` | `--color-border` @ 50% | Полупрозрачные границы |

## Типографика

| Класс | Font | Size | Weight | Tracking | Назначение |
|---|---|---|---|---|---|---|
| `font-monitoring-display text-3xl font-semibold tracking-tight` | Inter | 30px/36px | 600 | -0.025em | Заголовок страницы |
| `font-monitoring-display text-xl font-semibold tracking-tight` | Inter | 20px/28px | 600 | -0.025em | Заголовок секции |
| `font-monitoring-body text-base font-semibold` | Inter | 16px/24px | 600 | normal | Заголовок карточки |
| `font-monitoring-body text-sm font-normal` | Inter | 14px/20px | 400 | normal | Тело, таблицы |
| `font-monitoring-body text-xs font-semibold uppercase tracking-wider` | Inter | 12px/16px | 600 | 0.05em | Лейблы |
| `font-mono-accent text-xs font-medium` | JetBrains Mono | 12px/16px | 500 | normal | ID, даты, счётчики |
| `font-mono-accent text-xs font-medium text-text-secondary` | JetBrains Mono | 12px/16px | 500 | normal | Мета |

## Тени и скругления

| Класс | Значение | Назначение |
|---|---|---|
| `rounded-card` | `var(--radius-card)` | Скругление карточек и панелей |
| `shadow-soft-sm` | 0 1px 2px rgba(0,0,0,0.3) | Лёгкая тень для карточек |
| `shadow-soft-md` | 0 4px 6px rgba(0,0,0,0.3) | Средняя тень (hover карточек) |
| `shadow-soft-lg` | 0 10px 15px rgba(0,0,0,0.3) | Глубокая тень (модалки) |

## Статус-маппинг

| Сущность | Статусы | Цвета |
|---|---|---|
| Task | pending → processing → running → completed / failed | warning → info → primary → success / danger |
| Group | pending → processing → running → success / failed | warning → info → primary → success / danger |

## Каркас карточки

```tsx
<div className="overflow-hidden rounded-card border border-border/60 bg-background-secondary shadow-soft-sm transition-colors duration-200 hover:border-border hover:shadow-soft-md">
  {/* content */}
</div>
```
