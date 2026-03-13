# Дизайн: internal Telegram identifiers для sync участников

## Контекст

Пользователь хочет вытаскивать участников Telegram-чата не только по:

- `@username`
- публичной `t.me/...` ссылке
- invite-ссылке

но и по internal идентификаторам, которые часто встречаются в реальной работе:

- numeric channel id вида `-1001157519810`
- internal message link вида `https://t.me/c/1949542659/115914`

Сейчас система ведёт себя так:

- `-100...` распознаётся, но работает только если чат уже известен локальной БД и у нас есть metadata;
- `t.me/c/...` вообще падает как `Unsupported Telegram identifier format`.

Это создаёт два UX-пробела:

1. Пользователь не понимает, почему `t.me/c/...` не поддерживается.
2. Пользователь не понимает, почему `-100...` не работает при первом вводе.

## Важное ограничение Telegram

Если у пользователя есть только:

- `-100...`
или
- `t.me/c/<chatId>/<messageId>`

и больше ничего:

- нет `@username`;
- нет публичной ссылки;
- нет invite-ссылки;
- нет уже сохранённого `accessHash`;

то Telegram API не даёт надёжно открыть такой чат "с нуля".

Значит задача не в "магическом first-resolve", а в двух вещах:

- поддержать internal identifiers как валидные входы;
- честно объяснять bootstrap-flow для первого sync.

## Цель

Сделать `-100...` и `t.me/c/...` полноценными поддерживаемыми internal Telegram identifiers для sync участников.

Ожидаемое поведение:

- оба формата распознаются и нормализуются;
- оба ведут себя одинаково;
- если metadata уже есть, sync идёт успешно;
- если metadata нет, пользователь получает понятную инструкцию для первого bootstrap через `@username`, публичную или invite-ссылку.

## Не цели

- Не реализовывать невозможный first-resolve по голому internal ID.
- Не строить внешний metadata pipeline.
- Не добавлять auto-join по invite.
- Не использовать `messageId` из `t.me/c/...` для парсинга сообщения; задача только про чат и участников.

## Требования

### Функциональные

- Поддержать `t.me/c/<chatId>/<messageId>` в normalizer.
- Привести `t.me/c/...` к тому же internal chat id flow, что и `-100...`.
- Для unknown internal identifier возвращать единый actionable error.
- Добавить в UI helper text про первый bootstrap.
- Не ломать уже работающие сценарии по `@username`, public link и known numeric ID.

### Нефункциональные

- Ошибки должны быть понятны пользователю без чтения серверных логов.
- Код должен оставаться DRY: один unified flow для internal identifiers.
- Изменения должны быть минимальными и не ломать существующую архитектуру resolver-а.

## Подходы

### Вариант 1. Unified internal identifier flow

Поддерживаем:

- `-100...`
- `t.me/c/<chatId>/<messageId>`

Оба формата нормализуются к одному internal chat id и далее проходят одну и ту же resolver-ветку.

Плюсы:

- единая логика;
- меньше дублирования;
- UX предсказуемый.

Минусы:

- всё ещё нужен bootstrap для первого sync.

### Вариант 2. Отдельный flow для `t.me/c/...`

`t.me/c/...` становится отдельным типом идентификатора со своей ошибкой и своим поведением.

Плюсы:

- более точная типизация.

Минусы:

- бизнес-смысл тот же, а логика разъезжается;
- сложнее поддерживать.

### Вариант 3. Пытаться извлекать entity напрямую из `t.me/c/...`

Плюсы:

- иногда может случайно сработать, если chat metadata уже есть в клиентской сессии.

Минусы:

- не гарантировано;
- не решает unknown-first-sync;
- создаёт ложные ожидания.

### Решение

Выбрать вариант 1: unified internal identifier flow.

## Архитектура

### Normalization

`normalizeTelegramIdentifier()` должен поддержать ещё один паттерн:

- `https://t.me/c/<chatId>/<messageId>`

Для sync участников `messageId` не нужен как ключевая часть резолва.

Поэтому ссылка:

- `https://t.me/c/1949542659/115914`

нормализуется в internal chat id, эквивалентный:

- `-1001949542659`

Именно этот internal chat id дальше и участвует в resolver flow.

### Resolver

`TelegramIdentifierResolverService` получает unified internal identifier и обрабатывает его так же, как уже обрабатывает `channelNumericId`:

- ищет metadata в локальной БД;
- если metadata есть, открывает чат;
- если metadata нет, возвращает actionable bootstrap error.

### Bootstrap flow

Если internal identifier unknown:

- пользователь вручную открывает чат;
- находит `@username`, public link или invite link;
- один раз делает sync по этому public identifier;
- система сохраняет metadata;
- после этого можно использовать `-100...` или `t.me/c/...` как shorthand.

Это честный и рабочий flow в рамках ограничений Telegram API.

## Ошибки и API contract

### Сейчас

- `t.me/c/...` -> `Unsupported Telegram identifier format`
- `-100...` unknown -> `Cannot resolve Telegram chat by numeric ID without saved metadata`

### После изменения

Оба internal формата должны приводить к одному понятному message, если metadata нет:

- `Cannot perform the first sync by internal Telegram ID only. Use @username, public link, or invite link first. After the first successful sync, internal IDs like -100... and t.me/c/... will work.`

Можно оставить статус `400`, но текст должен быть action-oriented.

## Frontend UX

### Поле идентификатора

Под полем ввода нужен постоянный helper text:

- `Для первого импорта используйте @username, публичную или invite-ссылку. Internal ID и t.me/c/... работают для уже известных чатов.`

### Ошибка

Фронт не должен превращать этот кейс в generic fail.

Если backend вернул unified internal identifier error:

- пользователь видит понятную инструкцию;
- становится ясно, что сервис не "сломался", а ожидает bootstrap.

## Тестирование

### Backend

- unit: `t.me/c/...` распознаётся и превращается в internal identifier;
- unit: unknown `t.me/c/...` даёт unified actionable error;
- unit: unknown `-100...` даёт тот же unified error;
- unit: known numeric ID path продолжает работать.

### Frontend

- unit/component test: helper text отображается;
- unit/component test: unified internal identifier error показывается пользователю как инструкция.

### Manual

1. Ввести `https://t.me/c/...`
   Expected: если metadata нет, понятная инструкция bootstrap.
2. Ввести unknown `-100...`
   Expected: та же инструкция.
3. Ввести `@username` того же чата
   Expected: sync проходит.
4. Повторно ввести `-100...` или `t.me/c/...`
   Expected: sync проходит по saved metadata.

## Риски

- Пользователь может ожидать, что internal identifiers будут работать "с нуля".
- Слишком длинный текст ошибки ухудшит UX.
- Если фронт продолжит показывать generic toast поверх доменной ошибки, смысл backend-улучшения потеряется.

## Критерии успеха

- `t.me/c/...` больше не считается unsupported format.
- `t.me/c/...` и `-100...` ведут себя одинаково.
- Для unknown internal identifier пользователь видит понятную bootstrap-инструкцию.
- После первого sync по public identifier internal identifiers начинают работать как shorthand.
