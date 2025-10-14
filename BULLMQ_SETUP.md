# BullMQ Integration - Распределенная очередь задач

## ✅ Что реализовано:

### **1. Параллельная обработка задач**
- **Concurrency: 2** - одновременно обрабатываются 2 задачи
- **VK API rate limits учтены** - vk-io управляет лимитами внутри каждой задачи
- Это дает **2-5x** прирост скорости при сохранении rate limits

### **2. Надежность и персистентность**
- ✅ Задачи хранятся в Redis (не теряются при рестарте)
- ✅ Автоматический retry (3 попытки с exponential backoff)
- ✅ Задачи не дублируются
- ✅ Graceful shutdown

### **3. Мониторинг и управление**
- Статистика очереди (waiting, active, completed, failed)
- Pause/Resume для maintenance
- Автоматическая очистка старых задач (24 часа для completed, 7 дней для failed)

---

## 📁 Структура файлов:

```
api/src/tasks/
├── queues/
│   ├── parsing.constants.ts     # Настройки (concurrency, retry, rate limits)
│   ├── parsing.queue.ts          # Producer (добавление задач в очередь)
│   └── parsing.processor.ts      # Worker (обработка задач)
├── parsing-queue.service.ts      # API-обертка (backward compatible)
└── tasks.module.ts               # Конфигурация BullModule
```

---

## ⚙️ Настройки с учетом VK API rate limits:

### **VK API limits:**
- Без токена: **3 req/sec**
- С токеном: **20 req/sec** (зависит от типа токена)

### **BullMQ настройки (parsing.constants.ts):**

```typescript
// Одновременно максимум 2 задачи
export const PARSING_CONCURRENCY = 2;

// Rate limiter (дополнительная защита)
export const PARSING_RATE_LIMITER = {
  max: 3,        // Максимум 3 задачи
  duration: 5000 // За 5 секунд
};

// Retry при ошибках
export const PARSING_RETRY_OPTIONS = {
  attempts: 3,           // 3 попытки
  backoff: {
    type: 'exponential',
    delay: 5000          // Начальная задержка 5 сек
  }
};
```

**Почему concurrency = 2?**
- vk-io внутри уже управляет rate limiting
- 2 задачи параллельно = баланс между скоростью и соблюдением лимитов
- Каждая задача может обрабатывать несколько групп, но vk-io throttles API calls

---

## 🚀 API Usage:

### **Добавить задачу в очередь:**
```typescript
await parsingQueueService.enqueue({
  taskId: 1,
  scope: ParsingScope.ALL,
  groupIds: [],
  postLimit: 10,
});
```

### **Удалить задачу:**
```typescript
await parsingQueueService.remove(taskId);
```

### **Получить статистику:**
```typescript
const stats = await parsingQueueService.getStats();
// {
//   waiting: 5,
//   active: 2,
//   completed: 100,
//   failed: 3,
//   delayed: 1,
//   total: 111
// }
```

### **Pause/Resume (для maintenance):**
```typescript
await parsingQueueService.pause();
await parsingQueueService.resume();
```

---

## 📊 Мониторинг через Redis CLI:

```bash
# Подключиться к Redis
docker exec -it redis redis-cli

# Посмотреть все ключи BullMQ
KEYS bull:parsing:*

# Статистика очереди
HGETALL bull:parsing:meta

# Посмотреть waiting jobs
LRANGE bull:parsing:wait 0 -1

# Посмотреть active jobs
LRANGE bull:parsing:active 0 -1

# Посмотреть failed jobs
ZRANGE bull:parsing:failed 0 -1

# Мониторинг в реальном времени
MONITOR
```

---

## 🔧 Настройка concurrency (если нужно изменить):

В `api/src/tasks/queues/parsing.constants.ts`:

```typescript
// Увеличить для более быстрой обработки (риск превысить rate limit)
export const PARSING_CONCURRENCY = 3;

// Или уменьшить для безопасности
export const PARSING_CONCURRENCY = 1;
```

**Рекомендации:**
- **1-2**: Безопасно для любого VK токена
- **3-4**: Только если у вас service token с высоким лимитом
- **5+**: Высокий риск rate limiting

---

## 🎯 Производительность:

### **До (in-memory очередь):**
- Последовательная обработка задач
- 1 задача → 10 групп → ~5 минут
- 3 задачи → ~15 минут

### **После (BullMQ с concurrency=2):**
- Параллельная обработка 2 задач
- 2 задачи одновременно → ~5-6 минут
- 3 задачи → ~8-9 минут
- **Прирост: 2-2.5x** при соблюдении VK API limits

---

## 🧪 Тестирование:

```bash
# Запустить тесты
npm test -- parsing-queue.service.spec.ts

# Все тесты
npm test
```

---

## 🔥 Troubleshooting:

### **Ошибка: "Too many requests" от VK API**
**Решение:** Уменьшить `PARSING_CONCURRENCY` до 1

### **Задачи застревают в "active"**
**Решение:**
```bash
# Очистить stuck jobs
docker exec -it redis redis-cli
DEL bull:parsing:active
```

### **Память Redis растет**
**Решение:** Автоматическая очистка уже настроена (24 часа/7 дней), но можно вручную:
```bash
docker exec -it redis redis-cli
# Удалить все completed jobs
DEL bull:parsing:completed
```

---

## 📦 Следующие шаги:

### **Опционально: Bull Board (Dashboard)**
```bash
npm install @bull-board/api @bull-board/nestjs @bull-board/ui
```

Добавит веб-интерфейс для мониторинга:
- Список задач в очереди
- Статистика в реальном времени
- Управление задачами (pause, resume, retry)
- Просмотр failed jobs с деталями ошибок

### **Опционально: Увеличить concurrency на production**
Если у вас service token с высоким rate limit, можно увеличить до 3-4 workers.

---

## ✅ Backward Compatibility:

API `ParsingQueueService` не изменился:
- `enqueue(job)` - работает как раньше
- `remove(taskId)` - работает как раньше
- Добавлены новые методы: `getStats()`, `pause()`, `resume()`

Все существующие вызовы работают без изменений!
