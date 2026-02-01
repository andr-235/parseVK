# Intelligence Hub Design System

Современная дизайн-система для приложения parseVK, созданная для масштабирования на все страницы.

## 🎨 Визуальная концепция

**Intelligence Hub** — это профессиональная аналитическая эстетика с характером:

- Живые mesh градиенты (не агрессивные, сбалансированные)
- Геометрическая типографика
- Глубина через glow эффекты и shadows
- Floating elements с тонкими анимациями
- Cyan/Blue акценты на темном фоне

## 📐 Типографика

### Шрифты

```css
/* Основной дисплейный шрифт */
font-family: "Outfit", "Space Grotesk", sans-serif;
/* Класс: font-monitoring-display */

/* Основной текстовый шрифт */
font-family: "Outfit", "IBM Plex Sans", sans-serif;
/* Класс: font-monitoring-body */

/* Монокосмический акцентный шрифт */
font-family: "JetBrains Mono", monospace;
/* Класс: font-mono-accent */
```

### Иерархия

```tsx
// Главные заголовки страниц
<h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
  Intelligence <span className="text-cyan-400">Hub</span>
</h1>

// Заголовки секций
<h2 className="font-monitoring-display text-2xl font-semibold text-white">
  Заголовок
</h2>

// Подзаголовки
<h3 className="font-monitoring-display text-lg font-medium text-slate-300">
  Подзаголовок
</h3>

// Labels
<Label className="text-xs font-medium uppercase tracking-wider text-slate-300">
  Метка поля
</Label>

// Мелкий текст / метрики
<span className="text-xs text-slate-500 font-mono-accent">
  Status: Online
</span>
```

## 🎨 Цветовая палитра

### Основные цвета

```css
/* Фоны */
--bg-dark-base: #0b1220 (background для body) --bg-dark-card: #111827 (карточки)
  --bg-dark-elevated: rgb(15 23 42) (slate-900)
  --bg-dark-input: rgb(30 41 59 / 0.5) (slate-800/50) /* Текст */
  --text-primary: #ffffff --text-secondary: rgb(203 213 225) (slate-300)
  --text-muted: rgb(148 163 184) (slate-400) --text-dimmed: rgb(100 116 139)
  (slate-500) /* Borders */ --border-subtle: rgb(255 255 255 / 0.1) (white/10)
  --border-focus: rgb(34 211 238 / 0.5) (cyan-400/50);
```

### Акцентные цвета

```css
/* Primary Accent - Cyan/Blue */
--accent-cyan: #22d3ee (cyan-400) --accent-blue: #3b82f6 (blue-500)
  --accent-purple: #a855f7 (purple-500) /* Gradients */ bg-gradient-to-r
  from-cyan-500 to-blue-500 bg-gradient-to-r from-cyan-500 via-blue-500
  to-purple-500 /* Status Colors */ --success: #22c55e (green-500)
  --warning: #f59e0b (amber-500) --error: #ef4444 (red-500) --info: #0ea5e9
  (sky-500);
```

## 🌈 Фоновые эффекты

### Animated Mesh Gradient

Используйте на полноэкранных страницах (login, dashboards):

```tsx
<div className="absolute inset-0 opacity-60">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-cyan-950" />
  <div
    className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/30 blur-[120px] animate-pulse"
    style={{ animationDuration: "8s" }}
  />
  <div
    className="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-cyan-500/20 blur-[120px] animate-pulse"
    style={{ animationDuration: "12s", animationDelay: "2s" }}
  />
  <div
    className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-[100px] animate-pulse"
    style={{ animationDuration: "10s", animationDelay: "4s" }}
  />
</div>
```

### Grid Overlay

Тонкая сетка для depth:

```tsx
<div
  className="absolute inset-0 opacity-[0.03]"
  style={{
    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                     linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
    backgroundSize: "50px 50px",
  }}
/>
```

### Floating Particles

Для динамики (опционально):

```tsx
<div className="absolute inset-0 overflow-hidden">
  {[...Array(20)].map((_, i) => (
    <div
      key={i}
      className="absolute h-1 w-1 rounded-full bg-cyan-400/40 animate-float"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 10}s`,
        animationDuration: `${15 + Math.random() * 10}s`,
      }}
    />
  ))}
</div>

<style>{`
  @keyframes float {
    0%, 100% {
      transform: translateY(0) translateX(0);
      opacity: 0;
    }
    10% { opacity: 1; }
    90% { opacity: 1; }
    50% {
      transform: translateY(-100vh) translateX(50px);
    }
  }
  .animate-float {
    animation: float linear infinite;
  }
`}</style>
```

## 🎴 Компоненты

### Карточка с Glow

```tsx
<div className="relative w-full max-w-md">
  {/* Glow Effect */}
  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 opacity-50 blur-2xl" />

  {/* Card */}
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-2xl">
    {/* Top Border Glow */}
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

    {/* Содержимое карточки */}
    <div className="p-8">{/* ... */}</div>

    {/* Bottom Accent Line */}
    <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
  </div>
</div>
```

### Input поля

```tsx
<div className="space-y-2">
  <Label className="text-xs font-medium uppercase tracking-wider text-slate-300">
    Логин
  </Label>
  <Input
    className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
    placeholder="Введите логин"
  />
</div>
```

### Primary Button

```tsx
<Button className="group relative h-11 overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
  <span className="relative flex items-center justify-center gap-2">
    <svg
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
    Войти
  </span>
</Button>
```

### Ghost Button

```tsx
<Button
  variant="ghost"
  className="h-11 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
>
  Назад
</Button>
```

### Badge / Status Indicator

```tsx
<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/50 px-4 py-1.5 text-xs text-slate-400 backdrop-blur-sm font-mono-accent">
  <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
  </span>
  System Online
</span>
```

### Error/Alert Box

```tsx
<div className="animate-in slide-in-from-top-2 fade-in-0 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
  <span className="font-mono-accent">⚠</span> Ошибка: Неверные данные
</div>
```

### Decorative Line

```tsx
<div className="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
```

## 🎬 Анимации

### Появление элементов

```tsx
// Fade in + Zoom (для логотипов, иконок)
<div className="animate-in fade-in-0 zoom-in-95 duration-700">
  {/* ... */}
</div>

// Fade in + Slide from bottom (для текста)
<div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
  {/* ... */}
</div>

// Stagger анимации - используйте delay-{100,200,300} для последовательности
```

### Hover эффекты

```tsx
// Subtle scale
<div className="transition-transform duration-300 hover:scale-105">

// Glow intensify
<div className="transition-shadow duration-300 hover:shadow-xl hover:shadow-cyan-500/40">

// Color shift
<div className="transition-colors duration-200 hover:text-white">
```

## 📊 Применение для разных типов страниц

### Полноэкранные страницы (Login, Dashboards)

- Используйте Animated Mesh Gradient на фоне
- Floating particles для динамики
- Centered карточки с glow эффектами
- `min-h-screen` контейнер

### Страницы с Sidebar (Tasks, Groups, Comments)

- Убрать mesh gradиент (слишком отвлекает)
- Использовать простой `bg-background`
- Карточки с тонкими borders `border-white/10`
- Subtle glow только на hover
- Grid overlay опционально

### Таблицы

```tsx
<div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
  <table className="w-full">
    <thead className="bg-slate-800/50">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
          Название
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-white/5">
      <tr className="hover:bg-white/5 transition-colors">
        <td className="px-4 py-3 text-sm text-slate-200">Данные</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Модальные окна

```tsx
<Dialog>
  <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-2xl">
    {/* Top glow */}
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

    <DialogHeader>
      <DialogTitle className="font-monitoring-display text-xl text-white">
        Заголовок
      </DialogTitle>
    </DialogHeader>

    {/* ... */}

    {/* Bottom accent */}
    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
  </DialogContent>
</Dialog>
```

## 🔧 Utility классы

```css
/* Стеклянные поверхности */
.glassmorphic-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--card-border-radius);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(var(--glass-blur));
}

/* Кастомные utility классы можно добавить в index.css */
```

## 💡 Принципы дизайна

1. **Depth через layers**: Используйте glow, backdrop-blur, shadows для создания глубины
2. **Контраст через акценты**: Cyan/Blue акценты на темном фоне привлекают внимание
3. **Smooth transitions**: Все интерактивные элементы имеют плавные переходы (200-300ms)
4. **Breathing space**: Generous padding (px-8, py-6) для читаемости
5. **Geometric consistency**: Радиусы скруглений: rounded-lg (8px), rounded-xl (12px), rounded-2xl (16px)
6. **Professional animations**: Subtle и purposeful, не отвлекающие

## 📝 Чек-лист при создании новых страниц

- [ ] Используется `font-monitoring-body` на корневом элементе
- [ ] Заголовки используют `font-monitoring-display`
- [ ] Мелкий текст / метрики используют `font-mono-accent`
- [ ] Input поля имеют класс `h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500`
- [ ] Primary кнопки используют градиент `from-cyan-500 to-blue-500`
- [ ] Карточки имеют `border-white/10 bg-slate-900/80 backdrop-blur-2xl`
- [ ] Hover эффекты добавлены на интерактивные элементы
- [ ] Используется stagger анимация для появления элементов (delay-100, delay-200, etc.)
- [ ] Цветовая палитра согласована (cyan/blue акценты)
- [ ] Spacing консистентный (space-y-5 для форм, px-8 py-6 для контента)

## 🚀 Примеры применения

См. реализацию в:

- `/modules/auth/components/LoginPage.tsx` - полноэкранная страница с mesh градиентом
- `/modules/auth/components/ChangePasswordPage.tsx` - полноэкранная страница

Следуя этим гайдлайнам, вы сможете создать консистентный, профессиональный и запоминающийся интерфейс для всех страниц приложения parseVK.
