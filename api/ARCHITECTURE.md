# Архитектура backend-проекта

## Структура проекта

```
src/
├── app.module.ts          # Главный модуль приложения
├── main.ts                # Точка входа, bootstrap
├── prisma.service.ts      # Prisma клиент (глобальный)
├── {module}/              # Доменные модули
│   ├── {module}.module.ts        # Модуль NestJS
│   ├── {module}.controller.ts    # HTTP контроллер
│   ├── {module}.service.ts       # Бизнес-логика
│   ├── dto/                      # Data Transfer Objects (валидация входных данных)
│   ├── interfaces/               # Интерфейсы для абстракций
│   ├── repositories/             # Репозитории для работы с БД
│   ├── mappers/                  # Мапперы для преобразования данных
│   ├── builders/                 # Билдеры для построения запросов/объектов
│   ├── validators/               # Валидаторы бизнес-логики
│   ├── parsers/                  # Парсеры данных
│   ├── strategies/               # Стратегии (паттерн Strategy)
│   ├── services/                 # Дополнительные сервисы модуля
│   ├── queues/                   # Очереди BullMQ (если нужны)
│   ├── automation/               # Автоматизация (если нужна)
│   └── types/                    # Типы модуля (если специфичны)
├── common/                 # Общие модули и утилиты
│   ├── common.module.ts
│   ├── services/           # Общие сервисы (AuthorActivityService и т.п.)
│   ├── filters/            # Глобальные exception filters
│   ├── interceptors/       # Глобальные interceptors
│   ├── cache/              # Кэширование
│   ├── constants/          # Общие константы
│   ├── utils/              # Общие утилиты
│   └── types/              # Общие типы
└── vk/                     # Модуль интеграции с VK API
    ├── vk.module.ts
    ├── vk.service.ts
    └── interfaces/
```

## Правила зависимостей

### Схема зависимостей

```
{module}.controller.ts
  ↓ может использовать
  {module}.service.ts, dto/, interfaces/

{module}.service.ts
  ↓ может использовать
  repositories/, mappers/, builders/, validators/, parsers/, strategies/, services/, common/, vk/

repositories/
  ↓ может использовать
  prisma.service.ts, mappers/, interfaces/

mappers/
  ↓ может использовать
  dto/, types/, interfaces/

builders/
  ↓ может использовать
  types/, interfaces/

validators/
  ↓ может использовать
  dto/, types/, interfaces/

parsers/
  ↓ может использовать
  types/, interfaces/

strategies/
  ↓ может использовать
  interfaces/, types/

services/ (внутри модуля)
  ↓ может использовать
  repositories/, mappers/, common/, vk/, types/

queues/
  ↓ может использовать
  services/, repositories/, common/, vk/

common/
  ↓ может использовать
  vk/, prisma.service.ts, types/

vk/
  ↓ может использовать
  interfaces/, types/

types/
  ↓ не зависит ни от чего
```

### Детальные правила

1. **{module}.controller.ts** — HTTP слой
   - Только маршрутизация и валидация входных данных через DTO
   - Вызывает методы сервиса
   - Возвращает данные (не Prisma модели напрямую)
   - Использует декораторы NestJS (@Get, @Post, @Body, @Query и т.п.)

2. **{module}.service.ts** — бизнес-логика
   - Оркестрирует работу репозиториев, мапперов, билдеров
   - Не содержит прямых запросов к Prisma (только через репозитории)
   - Может использовать другие сервисы (common, vk)
   - Может использовать стратегии, валидаторы, парсеры

3. **repositories/** — работа с БД
   - Инкапсулирует Prisma запросы
   - Возвращает Prisma модели или простые типы
   - Может использовать мапперы для преобразования
   - Реализует интерфейсы репозиториев

4. **mappers/** — преобразование данных
   - Преобразуют Prisma модели в DTO
   - Преобразуют DTO в Prisma данные
   - Чистые функции без побочных эффектов

5. **builders/** — построение сложных объектов
   - Query builders (Prisma запросы)
   - Filter builders (фильтры для запросов)
   - Context builders (контекст для выполнения)

6. **validators/** — валидация бизнес-логики
   - Валидация данных на уровне бизнес-правил
   - Отдельно от class-validator (который в DTO)
   - Могут выбрасывать исключения

7. **parsers/** — парсинг данных
   - Парсинг JSON, строк, сложных структур
   - Преобразование форматов данных

8. **strategies/** — паттерн Strategy
   - Разные реализации одного алгоритма
   - Например: OffsetPaginationStrategy, CursorPaginationStrategy
   - Реализуют общий интерфейс

9. **services/** (внутри модуля) — дополнительные сервисы
   - Специфичная логика модуля
   - Могут использоваться основным сервисом
   - Например: WatchlistAuthorRefresherService, WatchlistStatsCollectorService

10. **queues/** — фоновые задачи
    - BullMQ очереди и процессоры
    - Асинхронная обработка задач
    - Могут использовать сервисы и репозитории

11. **common/** — общие компоненты
    - Общие сервисы (AuthorActivityService)
    - Глобальные фильтры, interceptors
    - Кэширование
    - Утилиты

12. **vk/** — интеграция с VK API
    - Обёртка над vk-io библиотекой
    - Методы для работы с VK API
    - Используется другими модулями

13. **dto/** — Data Transfer Objects
    - Валидация входных данных через class-validator
    - Используются в контроллерах
    - Могут использоваться в мапперах

14. **interfaces/** — контракты
    - Интерфейсы для репозиториев, стратегий, сервисов
    - Позволяют использовать dependency injection
    - Упрощают тестирование

15. **types/** — типы TypeScript
    - Типы для внутренней логики
    - Не зависят от других слоёв

## Стандарт структуры модуля

### Базовая структура

Каждый модуль должен иметь следующую структуру:

```
{module}/
  {module}.module.ts          # Модуль NestJS (обязательно)
  {module}.controller.ts       # HTTP контроллер (если есть API)
  {module}.service.ts          # Основной сервис (обязательно)
  dto/                         # DTO для валидации (если есть API)
  interfaces/                  # Интерфейсы (если нужны абстракции)
  repositories/                # Репозитории (если работа с БД)
  mappers/                     # Мапперы (если нужны преобразования)
  builders/                    # Билдеры (если нужны сложные запросы)
  validators/                  # Валидаторы (если нужна бизнес-валидация)
  parsers/                     # Парсеры (если нужен парсинг)
  strategies/                  # Стратегии (если нужны разные алгоритмы)
  services/                    # Дополнительные сервисы (если нужны)
  queues/                      # Очереди (если нужны фоновые задачи)
  types/                       # Типы модуля (если специфичны)
```

### Когда использовать подпапки модуля

#### `dto/` — всегда для модулей с API

Все входные данные должны быть валидированы через DTO с class-validator:

```typescript
// dto/create-group.dto.ts
export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;
}
```

**Примеры:**

- `dto/create-group.dto.ts`
- `dto/list-authors-query.dto.ts`
- `dto/update-comment-read.dto.ts`

#### `repositories/` — когда работа с БД

Используйте репозитории для инкапсуляции Prisma запросов:

```typescript
// repositories/comments.repository.ts
export class CommentsRepository implements ICommentsRepository {
  constructor(private prisma: PrismaService) {}

  async findMany(filters: CommentsFilters): Promise<Comment[]> {
    // Prisma запросы
  }
}
```

**Примеры:**

- `repositories/comments.repository.ts`
- `repositories/watchlist.repository.ts`

#### `mappers/` — когда нужны преобразования

Используйте мапперы для преобразования между Prisma моделями и DTO:

```typescript
// mappers/comment.mapper.ts
export class CommentMapper {
  static toDto(comment: Comment): CommentWithAuthorDto {
    // преобразование
  }
}
```

**Примеры:**

- `mappers/comment.mapper.ts`
- `mappers/task.mapper.ts`
- `mappers/watchlist-author.mapper.ts`

#### `builders/` — когда нужны сложные запросы

Используйте билдеры для построения сложных Prisma запросов или фильтров:

```typescript
// builders/comments-filter.builder.ts
export class CommentsFilterBuilder {
  build(filters: CommentsFilters): Prisma.CommentWhereInput {
    // построение фильтра
  }
}
```

**Примеры:**

- `builders/comments-filter.builder.ts`
- `builders/task-context.builder.ts`
- `builders/author-sort.builder.ts`

#### `validators/` — когда нужна бизнес-валидация

Используйте валидаторы для проверки бизнес-правил (отдельно от class-validator):

```typescript
// validators/comments-query.validator.ts
export class CommentsQueryValidator {
  validate(query: CommentsQueryDto): void {
    // бизнес-валидация
    if (invalid) throw new BadRequestException();
  }
}
```

**Примеры:**

- `validators/comments-query.validator.ts`
- `validators/watchlist-query.validator.ts`
- `validators/group-identifier.validator.ts`

#### `parsers/` — когда нужен парсинг

Используйте парсеры для парсинга сложных данных:

```typescript
// parsers/task-description.parser.ts
export class TaskDescriptionParser {
  parse(description: string): TaskDescription {
    // парсинг JSON или строк
  }
}
```

**Примеры:**

- `parsers/task-description.parser.ts`
- `parsers/author-counters.parser.ts`

#### `strategies/` — когда нужны разные алгоритмы

Используйте стратегии для разных реализаций одного алгоритма:

```typescript
// strategies/cursor-pagination.strategy.ts
export class CursorPaginationStrategy implements IPaginationStrategy {
  paginate(query: PaginationQuery): PaginationResult {
    // курсорная пагинация
  }
}
```

**Примеры:**

- `strategies/cursor-pagination.strategy.ts`
- `strategies/offset-pagination.strategy.ts`
- `strategies/webhook-moderation.strategy.ts`

#### `services/` — когда нужны дополнительные сервисы

Используйте дополнительные сервисы для разделения ответственности:

```typescript
// services/watchlist-author-refresher.service.ts
export class WatchlistAuthorRefresherService {
  async refresh(author: WatchlistAuthor): Promise<void> {
    // специфичная логика обновления
  }
}
```

**Примеры:**

- `services/watchlist-author-refresher.service.ts`
- `services/watchlist-stats-collector.service.ts`
- `services/photo-analysis-facade.service.ts`

#### `queues/` — когда нужны фоновые задачи

Используйте очереди BullMQ для асинхронной обработки:

```typescript
// queues/parsing.queue.ts
export class ParsingQueueProducer {
  async addTask(taskId: number): Promise<void> {
    await this.queue.add('parse', { taskId });
  }
}

// queues/parsing.processor.ts
@Processor(PARSING_QUEUE)
export class ParsingProcessor {
  @Process('parse')
  async handleParse(job: Job<ParseJobData>): Promise<void> {
    // обработка задачи
  }
}
```

**Примеры:**

- `queues/parsing.queue.ts`
- `queues/parsing.processor.ts`

#### `interfaces/` — когда нужны абстракции

Используйте интерфейсы для dependency injection и тестирования:

```typescript
// interfaces/comments-repository.interface.ts
export interface ICommentsRepository {
  findMany(filters: CommentsFilters): Promise<Comment[]>;
}

// В модуле
{
  provide: 'ICommentsRepository',
  useClass: CommentsRepository,
}
```

**Примеры:**

- `interfaces/comments-repository.interface.ts`
- `interfaces/pagination-strategy.interface.ts`
- `interfaces/watchlist-repository.interface.ts`

#### `types/` — когда типы специфичны для модуля

Используйте типы модуля для внутренней логики:

```typescript
// types/comments-filters.type.ts
export type CommentsFilters = {
  keywordIds?: number[];
  authorIds?: number[];
  // ...
};
```

**Примеры:**

- `types/comments-filters.type.ts`
- `types/authors.types.ts`

## Импорты

### Использование относительных путей

Все импорты внутри модуля должны использовать относительные пути:

```typescript
// ✅ Правильно (относительные импорты)
import { CommentsRepository } from './repositories/comments.repository';
import { CommentMapper } from './mappers/comment.mapper';
import type { ICommentsRepository } from './interfaces/comments-repository.interface';

// ✅ Правильно (импорты из других модулей)
import { PrismaService } from '../prisma.service';
import { VkModule } from '../vk/vk.module';
import { CommonModule } from '../common/common.module';

// ❌ Неправильно (абсолютные импорты из src/)
import { PrismaService } from '@/prisma.service';
```

### Импорты между модулями

Импорты между модулями должны идти через exports модулей:

```typescript
// ✅ Правильно: через exports модуля
@Module({
  imports: [VkModule, CommonModule],
  // ...
})

// ❌ Неправильно: прямой импорт сервиса
import { VkService } from '../vk/vk.service';
```

## Разделение ответственности

### Контроллер

Контроллер отвечает только за:

- Маршрутизацию HTTP запросов
- Валидацию входных данных через DTO
- Вызов методов сервиса
- Возврат данных клиенту

```typescript
@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  async list(@Query() query: ListCommentsQueryDto): Promise<CommentsListDto> {
    return this.commentsService.list(query);
  }
}
```

### Сервис

Сервис отвечает за:

- Оркестрацию бизнес-логики
- Использование репозиториев, мапперов, билдеров
- Валидацию бизнес-правил
- Координацию между компонентами

```typescript
@Injectable()
export class CommentsService {
  constructor(
    @Inject('ICommentsRepository')
    private repository: ICommentsRepository,
    private mapper: CommentMapper,
    private filterBuilder: CommentsFilterBuilder,
  ) {}

  async list(query: ListCommentsQueryDto): Promise<CommentsListDto> {
    const filters = this.filterBuilder.build(query);
    const comments = await this.repository.findMany(filters);
    return this.mapper.toListDto(comments);
  }
}
```

### Репозиторий

Репозиторий отвечает за:

- Инкапсуляцию Prisma запросов
- Работу с БД
- Возврат Prisma моделей

```typescript
@Injectable()
export class CommentsRepository implements ICommentsRepository {
  constructor(private prisma: PrismaService) {}

  async findMany(filters: CommentsFilters): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: filters,
    });
  }
}
```

## Работа с Prisma

### PrismaService

PrismaService — глобальный сервис, доступный во всех модулях:

```typescript
// В любом сервисе или репозитории
constructor(private prisma: PrismaService) {}
```

### Миграции

Миграции находятся в `prisma/migrations/`:

```bash
# Создать миграцию
npx prisma migrate dev --name migration_name

# Применить миграции в production
npx prisma migrate deploy
```

### Схема

Схема Prisma находится в `prisma/schema.prisma`. После изменений:

```bash
# Сгенерировать Prisma Client
npx prisma generate
```

## Работа с очередями (BullMQ)

### Настройка очереди

```typescript
// В модуле
BullModule.registerQueue({
  name: PARSING_QUEUE,
  defaultJobOptions: {
    removeOnComplete: { age: 24 * 60 * 60, count: 100 },
    removeOnFail: { age: 7 * 24 * 60 * 60 },
  },
}),
```

### Producer

```typescript
@Injectable()
export class ParsingQueueProducer {
  constructor(
    @InjectQueue(PARSING_QUEUE)
    private queue: Queue,
  ) {}

  async addTask(taskId: number): Promise<void> {
    await this.queue.add('parse', { taskId });
  }
}
```

### Processor

```typescript
@Processor(PARSING_QUEUE)
export class ParsingProcessor {
  @Process('parse')
  async handleParse(job: Job<ParseJobData>): Promise<void> {
    // обработка задачи
  }
}
```

## WebSocket (Gateway)

Для real-time обновлений используйте Gateway:

```typescript
@WebSocketGateway()
export class TasksGateway {
  @WebSocketServer()
  server: Server;

  emitTaskUpdate(taskId: number, progress: number): void {
    this.server.emit('task:update', { taskId, progress });
  }
}
```

## Валидация

### DTO валидация (class-validator)

```typescript
export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;
}
```

Валидация включается глобально в `main.ts` через `ValidationPipe`.

### Бизнес-валидация

Для сложной бизнес-логики используйте отдельные валидаторы:

```typescript
@Injectable()
export class CommentsQueryValidator {
  validate(query: CommentsQueryDto): void {
    if (query.cursor && query.offset) {
      throw new BadRequestException('Cannot use both cursor and offset');
    }
  }
}
```

## Обработка ошибок

### Глобальный фильтр

```typescript
// common/filters/http-exception.filter.ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // обработка ошибок
  }
}
```

Регистрируется в `main.ts`:

```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```

## Логирование

### Глобальный interceptor

```typescript
// common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // логирование запросов
  }
}
```

Регистрируется в `main.ts`:

```typescript
app.useGlobalInterceptors(new LoggingInterceptor());
```

## Тестирование

В проекте используется [Vitest](https://vitest.dev/). Конфигурация: `vitest.config.ts`, e2e: `vitest.e2e.config.ts`, setup: `vitest.setup.ts`.

### Unit тесты

Тесты для сервисов и репозиториев (моки через `vi.fn()`):

```typescript
import { vi } from 'vitest';

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: vi.Mocked<ICommentsRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: 'ICommentsRepository',
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(CommentsService);
    repository = module.get('ICommentsRepository');
  });

  it('should list comments', async () => {
    // тест
  });
});
```

### E2E тесты

Тесты для контроллеров:

```typescript
describe('CommentsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/comments (GET)', () => {
    return request(app.getHttpServer()).get('/api/comments').expect(200);
  });
});
```

## Примеры модулей

### Простой модуль (Groups)

```
groups/
  groups.module.ts
  groups.controller.ts
  groups.service.ts
  dto/
    create-group.dto.ts
    group.dto.ts
  mappers/
    group.mapper.ts
  validators/
    group-identifier.validator.ts
  interfaces/
    group-identifier.interface.ts
```

### Сложный модуль (Comments)

```
comments/
  comments.module.ts
  comments.controller.ts
  comments.service.ts
  dto/
    comments-list.dto.ts
    comments-cursor.dto.ts
    update-comment-read.dto.ts
  repositories/
    comments.repository.ts
  mappers/
    comment.mapper.ts
  builders/
    comments-filter.builder.ts
  validators/
    comments-query.validator.ts
  strategies/
    cursor-pagination.strategy.ts
    offset-pagination.strategy.ts
  interfaces/
    comments-repository.interface.ts
    pagination-strategy.interface.ts
  types/
    comments-filters.type.ts
```

### Модуль с очередями (Tasks)

```
tasks/
  tasks.module.ts
  tasks.controller.ts
  tasks.service.ts
  tasks.gateway.ts
  parsing-task.runner.ts
  parsing-queue.service.ts
  task-cancellation.service.ts
  dto/
    create-task.dto.ts
  mappers/
    task.mapper.ts
  parsers/
    task-description.parser.ts
  builders/
    task-context.builder.ts
  queues/
    parsing.queue.ts
    parsing.processor.ts
    parsing.constants.ts
  automation/
    task-automation.service.ts
    task-automation.controller.ts
  interfaces/
    task-runner.interface.ts
```

## Чек-лист для новых фич

При добавлении новой фичи:

1. ✅ Создать модуль в `{module}/{module}.module.ts`
2. ✅ Добавить контроллер в `{module}/{module}.controller.ts` (если есть API)
3. ✅ Добавить сервис в `{module}/{module}.service.ts`
4. ✅ Создать DTO в `{module}/dto/` для валидации входных данных
5. ✅ Создать репозиторий в `{module}/repositories/` (если работа с БД)
6. ✅ Создать маппер в `{module}/mappers/` (если нужны преобразования)
7. ✅ Использовать интерфейсы для абстракций (если нужны)
8. ✅ Зарегистрировать модуль в `app.module.ts`
9. ✅ Написать тесты для сервиса и контроллера
10. ✅ Следовать правилам зависимостей между слоями

## Проверка соответствия архитектуре

### Аудит зависимостей

После изменений рекомендуется проверить соблюдение правил зависимостей:

1. **Контроллеры не используют Prisma напрямую**

   ```bash
   find api/src -name "*.controller.ts" | xargs grep -l "PrismaService"
   ```

2. **Сервисы не используют Prisma напрямую (только через репозитории)**

   ```bash
   find api/src -name "*.service.ts" | xargs grep -l "this.prisma\."
   ```

3. **Репозитории не содержат бизнес-логику**

   ```bash
   # Проверка: репозитории только работают с БД
   ```

4. **Все DTO используют class-validator**
   ```bash
   find api/src -path "*/dto/*" -name "*.ts" | xargs grep -L "@Is"
   ```

### Текущее состояние

✅ Модульная архитектура NestJS соблюдается  
✅ Разделение на контроллеры, сервисы, репозитории  
✅ Использование DTO для валидации  
✅ Использование интерфейсов для абстракций  
✅ Правила зависимостей соблюдаются
