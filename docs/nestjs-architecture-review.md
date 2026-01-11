# Анализ архитектуры NestJS API

## Исполнительное резюме

Проект уже разделен на доменные модули, использует DTO, репозитории, стратегии и глобальные пайпы. Однако есть системные перекосы: безопасность не закрыта (нет auth/guards), доступ к БД размазан по сервисам и очередям, а PrismaService создается многократно. Это повышает риск инцидентов в проде (доступ без авторизации, истощение пула соединений) и делает поддержку дороже. Ниже — конкретные проблемы и практичный план улучшений без оверинжиниринга.

## Выявленные недостатки

### Критические проблемы

- Место: `api/src/tasks/tasks.module.ts:42`, `api/src/authors/authors.module.ts:14`, `api/src/telegram/telegram.module.ts:21`; Проблема: PrismaService регистрируется в каждом модуле, создавая несколько экземпляров PrismaClient; Почему: это множит пулы соединений, повышает нагрузку на БД, усложняет транзакции и может привести к исчерпанию соединений; Приоритет: критический.

### Важные проблемы

- Место: `api/src/tasks/parsing-task.runner.ts:10`, `api/src/tasks/queues/parsing.processor.ts:5`, `api/src/tasks/automation/task-automation.service.ts:8`, `api/src/telegram/telegram-auth.service.ts:14`, `api/src/photo-analysis/services/author.service.ts:2`; Проблема: сервисы и воркеры напрямую используют PrismaService, обходя репозитории; Почему: размываются границы слоев, усложняется тестирование и контроль транзакций, нарушаются правила из `api/ARCHITECTURE.md`; Приоритет: высокий.
- Место: `api/src/photo-analysis/interfaces/photo-analysis-repository.interface.ts:1`; Проблема: реализация репозитория лежит в каталоге `interfaces` и совмещена с интерфейсом; Почему: нарушает договоренности структуры, затрудняет навигацию и поддержку, путает слои; Приоритет: высокий.
- Место: `api/src/app.module.ts:29`, `api/src/telegram/telegram-auth.service.ts:52`, `api/src/config/app.config.ts:3`; Проблема: часть конфигурации (BullMQ, Telegram) читается напрямую из `process.env` или по сырым ключам и не валидируется через AppConfig; Почему: ошибки конфигурации проявляются в рантайме, нет единых дефолтов/валидации, выше риск неконсистентной среды; Приоритет: высокий.
- Место: `api/src/tasks/tasks.service.ts:9`, `api/src/tasks/tasks.service.ts:72`; Проблема: сервисный слой опирается на Prisma-типы (`Prisma.TaskUncheckedCreateInput/UpdateInput`); Почему: протекает слой хранения данных в бизнес-логику, усложняется смена ORM и тестирование; Приоритет: средний.
- Место: `api/src/tasks/parsing-task.runner.ts:1`, `api/src/common/services/author-activity.service.ts:1`; Проблема: крупные сервисы объединяют несколько ответственностей (оркестрация, обращение к VK, сохранение в БД, рассылка прогресса); Почему: высокая связность и низкая тестируемость, любое изменение рискованно; Приоритет: средний.

### Возможные улучшения

- Место: `api/src/comments/comments.controller.ts:26`, `api/src/groups/groups.controller.ts:39`; Проблема: часть запросов парсится вручную вместо DTO с валидацией; Почему: разная логика валидации по контроллерам, больше кода и меньше единообразия; Приоритет: низкий.
- Место: `api/src/tasks/parsing-task.runner.ts:1`, `api/src/tasks/queues/parsing.processor.ts:1`; Проблема: для ключевых фоновых процессов нет выделенных unit/integration тестов; Почему: сложнее безопасно менять логику выполнения задач и обработку ошибок; Приоритет: низкий.

## План улучшений

### Этап 1: Критические исправления выполнено

- Ввести базовую аутентификацию и авторизацию (API ключ или JWT + роли) и применить глобальный guard с исключениями для health/metrics при необходимости (оценка: средняя, зависимость: решение по модели доступа). выполнено
- Создать единый PrismaModule (Global) и удалить регистрацию PrismaService из модулей, чтобы иметь один пул соединений (оценка: малая, зависимость: нет).
- Пересмотреть CORS под новую модель доступа (строгий allow-list, отключить `credentials` там, где не нужно) (оценка: малая, зависимость: решение по auth и фронтенду).

### Этап 2: Важные улучшения

- Вынести прямые Prisma-вызовы из сервисов/воркеров в репозитории и использовать интерфейсы через DI (ParsingTaskRunner, ParsingProcessor, TaskAutomationService, TelegramAuthService, PhotoAnalysis AuthorService) (оценка: большая, зависимость: PrismaModule).
- Разнести интерфейс и реализацию PhotoAnalysisRepository по соответствующим каталогам (`interfaces/` + `repositories/`) и обновить провайдеры (оценка: малая).
- Централизовать конфигурацию: добавить Telegram и BullMQ настройки в AppConfig и использовать `BullModule.forRootAsync` с ConfigService (оценка: средняя).
- Убрать Prisma-типы из сервисного слоя, оставив их в репозиториях, а в сервисах работать с DTO/command объектами (оценка: средняя).

### Этап 3: Дополнительные оптимизации

- Декомпозировать ParsingTaskRunner и AuthorActivityService на меньшие сервисы (например: resolver групп, persister комментариев, broadcaster статусов) без усложнения доменной модели (оценка: средняя/большая).
- Добавить тесты для фонового выполнения задач и обработки ошибок (ParsingTaskRunner/ParsingProcessor) и минимальные интеграционные проверки по критичным сценариям (оценка: средняя).
- Привести обработку query-параметров к DTO + class-validator в контроллерах (оценка: малая).

## Примеры рефакторинга

Проблема: несколько экземпляров PrismaService.
Было:

```ts
// api/src/tasks/tasks.module.ts
providers: [
  TasksService,
  PrismaService,
  {
    provide: 'ITasksRepository',
    useClass: TasksRepository,
  },
],
```

Стало:

```ts
// api/src/prisma/prisma.module.ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

```ts
// api/src/tasks/tasks.module.ts
providers: [
  TasksService,
  {
    provide: 'ITasksRepository',
    useClass: TasksRepository,
  },
],
```

Пояснение: единый PrismaService предотвращает расползание пула соединений и упрощает транзакции.

Проблема: конфигурация BullMQ не валидируется AppConfig.
Было:

```ts
// api/src/app.module.ts
BullModule.forRoot({
  connection: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
}),
```

Стало:

```ts
// api/src/app.module.ts
BullModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService<AppConfig>) => ({
    connection: {
      host: config.get('redisHost', { infer: true }) ?? 'redis',
      port: config.get('redisPort', { infer: true }) ?? 6379,
    },
  }),
}),
```

Пояснение: единая точка конфигурации с валидацией снижает риск ошибок в окружении.

Проблема: прямой доступ к Prisma в сервисе.
Было:

```ts
// api/src/tasks/automation/task-automation.service.ts
constructor(private readonly prisma: PrismaService) {}

await this.prisma.taskAutomationSettings.update({
  where: { id: current.id },
  data: { enabled: dto.enabled, runHour: dto.runHour },
});
```

Стало:

```ts
// api/src/tasks/automation/task-automation.service.ts
constructor(
  @Inject('ITaskAutomationRepository')
  private readonly repository: ITaskAutomationRepository,
) {}

await this.repository.updateSettings(current.id, {
  enabled: dto.enabled,
  runHour: dto.runHour,
});
```

Пояснение: репозиторий изолирует слой хранения, упрощает тесты и повторное использование логики.

## Рекомендации по внедрению

- Сначала зафиксировать модель доступа (внутренний API vs публичный) и исходя из этого выбрать тип auth и жесткость CORS.
- Внести PrismaModule и убрать дубли провайдеров до начала большого рефакторинга, чтобы стабилизировать соединения.
- Рефакторинг репозиториев делать по модулю за шаг, с минимальными изменениями API и покрытием тестами критичных сценариев.
