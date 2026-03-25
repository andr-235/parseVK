# Telegram DL Match Queue Design

**Контекст**

Текущий `POST /api/telegram/dl-match/runs` запускает матчинг синхронно внутри HTTP-запроса. Даже после перехода на батчи это остаётся плохим execution model для объёмов порядка миллионов `DlContact`: клиент держит открытый запрос, контейнер не может быстро ответить, а наблюдаемость ограничена логами одного длинного request lifecycle.

В проекте уже используется `BullMQ` для фоновых задач парсинга. Это даёт готовый production-паттерн для выноса тяжёлого DL-матчинга в отдельную очередь без изобретения второй системы фонового выполнения.

**Цель**

Перевести запуск DL-матчинга на фоновую `BullMQ`-очередь так, чтобы `POST /api/telegram/dl-match/runs` отвечал сразу, сама обработка шла батчами в worker, а фронт видел прогресс через polling статуса запуска.

## Рекомендованный подход

Рекомендуется отдельная очередь `telegram-dl-match` на `BullMQ`.

Рассматривались альтернативы:
- запуск background task внутри того же Nest process без очереди
- отдельный cron/CLI worker, который подбирает `RUNNING`/`PENDING` записи из БД

Обе альтернативы хуже. In-process background task не переживает рестарты и не даёт нормального queue control. Отдельный cron/CLI усложняет эксплуатацию без выигрыша, потому что `BullMQ` уже подключён в проекте и покрывает нужный сценарий.

## Пользовательский поток

1. Пользователь нажимает `Найти совпадения в tgmbase`.
2. Бэкенд создаёт `DlMatchRun` со статусом `RUNNING`.
3. Бэкенд ставит `runId` в очередь `telegram-dl-match` и сразу возвращает ответ.
4. Фронт начинает polling `GET /api/telegram/dl-match/runs/:id`.
5. Worker обрабатывает `DlContact` батчами, пишет прогресс в `DlMatchRun` и пишет батчевые логи.
6. Когда статус становится `DONE`, фронт запрашивает `GET /api/telegram/dl-match/runs/:id/results`.
7. Кнопка `Выгрузить XLSX` становится доступной только для завершённого запуска.

## Архитектура

### Разделение ответственности

`TelegramDlMatchService` делится на два уровня:

- `createRun()`
  - создаёт запись запуска
  - ставит job в очередь
  - сразу возвращает `run`

- `processRun(runId)`
  - выполняется только из worker
  - читает `DlContact` батчами
  - ищет совпадения в `user` через bulk-запросы
  - сохраняет `DlMatchResult` пачками
  - обновляет прогресс и финальный статус

### Очередь

Новый модуль `telegram-dl-match/queues` включает:

- `telegram-dl-match.constants.ts`
  - имя очереди
  - `jobName`
  - `concurrency`
  - `attempts`
  - retry/backoff policy

- `telegram-dl-match.queue.ts`
  - producer
  - enqueue по `runId`

- `telegram-dl-match.processor.ts`
  - worker host
  - логирование старта, завершения и ошибок
  - вызов `service.processRun(runId)`

### Модуль

`TelegramDlMatchModule`:
- регистрирует queue через `BullModule.registerQueue`
- экспортирует service
- подключает producer и processor

## API

Внешний контракт почти не меняется.

### `POST /api/telegram/dl-match/runs`

Было:
- тяжёлая синхронная обработка всего матчинга
- запрос висит до конца работы

Станет:
- создаёт `run`
- enqueue job
- быстро отвечает:
  - `id`
  - `status = RUNNING`
  - текущие counters

### `GET /api/telegram/dl-match/runs/:id`

Остаётся источником polling для фронта.

Важно:
- `contactsTotal` на этапе `RUNNING` трактуется как число уже обработанных контактов
- после `DONE` это финальное число обработанных контактов

### `GET /api/telegram/dl-match/runs/:id/results`

Доступен после завершения, но контракт не требует отдельного запрета на этапе `RUNNING`. Фронт просто не должен полагаться на неполный результат, пока статус не `DONE`.

### `GET /api/telegram/dl-match/runs/:id/export`

Остаётся только для `DONE`, как и раньше.

## Прогресс и логирование

### Прогресс в БД

После каждого батча worker обновляет:
- `contactsTotal`
- `matchesTotal`
- `strictMatchesTotal`
- `usernameMatchesTotal`
- `phoneMatchesTotal`

Это позволяет фронту показывать живую summary-полоску без websocket.

### Логи

Нужны следующие события:

- старт job
  - `runId`
  - `estimatedContacts`
  - `batchSize`

- завершение каждого батча
  - `runId`
  - `processed`
  - `batchContacts`
  - `batchMatches`
  - `totalMatches`
  - `durationMs`
  - `lastContactId`

- завершение run
  - `runId`
  - `contactsTotal`
  - `matchesTotal`
  - `durationMs`

- ошибка
  - `runId`
  - `processed`
  - `lastContactId`
  - `error`

## Поведение фронта

Фронт не требует полной переработки.

Нужно добавить:
- polling активного run, пока статус `RUNNING`
- disabled состояние для повторного запуска
- loading-state в режиме результатов, пока run не завершён
- показ `run.error`, если статус `FAILED`

Текущий workflow страницы сохраняется:
- пользователь открывает `Матчинг DL`
- видит DL-базу
- запускает матчинг
- наблюдает прогресс
- после `DONE` видит финальные результаты

## Обработка ошибок

- если enqueue не удался, `createRun()` переводит run в `FAILED` и возвращает ошибку
- если processor падает, run обновляется до `FAILED`
- текст ошибки сохраняется в `DlMatchRun.error`
- частично сохранённые `DlMatchResult` допустимы только внутри одного незавершённого run; такой run считается `FAILED` и не должен использоваться как успешный результат

## Производительность

Worker должен использовать уже введённый батчевый pipeline:
- чтение `DlContact` пачками через cursor по `id`
- bulk lookup по `user_id`, `username`, `phone`
- `createMany` по результатам батча

Для первой очередной версии достаточно:
- `concurrency = 1`
- один job на один run
- без параллельной обработки нескольких DL-match запусков

Это защитит БД от конкурирующих тяжёлых матчей и сохранит предсказуемое время выполнения.

## Границы первой версии

Входят:
- отдельная BullMQ queue для DL-match
- быстрый `POST /runs`
- worker processing через `processRun`
- polling статуса на фронте
- батчевые progress-логи

Не входят:
- websocket/live events
- отмена run пользователем
- несколько параллельных DL-match worker jobs
- приоритеты и advanced scheduling

## Тестирование

### Backend

- unit: `createRun()` создаёт run и enqueue job без синхронного выполнения
- unit: processor вызывает `processRun(runId)`
- unit: `processRun()` обновляет counters по батчам и финализирует `DONE`
- unit: ошибка в processor переводит run в `FAILED`
- controller: `POST /runs` возвращает быстрый `RUNNING` run

### Frontend

- hook/page: после запуска включается polling
- UI: при `RUNNING` показывается прогресс
- UI: при `DONE` подгружаются результаты
- UI: при `FAILED` показывается ошибка

## Риски

- если фронт будет слишком часто поллить, можно создать лишнюю нагрузку; для первой версии достаточно 2-3 секунд
- если оставить возможность нескольких одновременных run, БД может получить конкурирующие тяжёлые задачи; поэтому первая версия должна ограничиться `concurrency = 1`
- если worker упадёт посередине, частичные результаты останутся у `FAILED` run; UI должен считать валидными только `DONE` запуски
