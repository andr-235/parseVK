# Tgmbase Search Progress Design

**Контекст**

Страница `tgmbase-search` уже умеет запускать массовый поиск и показывать итоговый отчёт, но во время выполнения пользователь видит только общий loading-state. После добавления внутреннего батчинга по 200 запросов поиск может выполняться заметно дольше, и пользователь не понимает, завис ли интерфейс, сколько уже обработано и на каком батче находится сервер.

**Цель**

Показать на фронтенде живой прогресс одного запуска поиска по tgmbase: количество обработанных запросов, общий объём, процент и текущий батч. Источником прогресса должен быть backend через WebSocket, а итоговый отчёт должен продолжать приходить обычным HTTP-ответом.

## Архитектура

Решение строится вокруг отдельной websocket-сессии поиска, связанной с клиентским `searchId`. Фронтенд перед запуском поиска генерирует `searchId`, подключается к отдельному namespace для tgmbase-прогресса и отправляет обычный POST `/tgmbase/search` с этим `searchId`. Бэкенд обрабатывает запрос, а сервис поиска публикует события `started`, `progress`, `completed`, `failed` в room этого `searchId`.

Итоговый HTTP-ответ остаётся текущим контрактом `summary + items`. WebSocket нужен только для промежуточного состояния. Это сохраняет совместимость API и не смешивает `tgmbase-search` с существующей системой `tasks`.

## Backend Components

`api/src/tgmbase-search/dto/tgmbase-search-request.dto.ts`

Добавляется опциональное поле `searchId`. Оно должно быть строкой и использоваться только для корреляции websocket-событий одного запуска.

`api/src/tgmbase-search/tgmbase-search.gateway.ts`

Новый `WebSocketGateway` с отдельным namespace, например `tgmbase-search`. Gateway должен:
- принимать событие подписки на `searchId`
- добавлять клиента в room по `searchId`
- уметь отправлять payload прогресса в конкретную комнату

`api/src/tgmbase-search/tgmbase-search.service.ts`

Сервис поиска должен публиковать:
- `started` в начале с `searchId`, `totalQueries`, `batchSize`, `totalBatches`
- `progress` после обработки каждого query с `processedQueries`, `totalQueries`, `currentBatch`, `totalBatches`
- `completed` перед возвратом HTTP-ответа
- `failed` при фатальной ошибке всего запуска

Текущая обработка по чанкам `200` сохраняется. Прогресс считается по фактически завершённым элементам и не требует отдельного persistent storage.

## Frontend Components

`front/src/modules/tgmbase-search/hooks/useTgmbaseSearchState.ts`

Хук должен управлять:
- текущим `searchId`
- websocket-соединением для одного активного запуска
- локальным состоянием прогресса (`status`, `processed`, `total`, `currentBatch`, `totalBatches`, `percent`, `connected`)

`front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx`

Страница должна показывать отдельный прогресс-блок во время поиска. В блоке нужны:
- статус (`Подключение`, `Выполняю поиск`, `Завершено`, `Ошибка`)
- прогресс-бар
- `обработано X из Y`
- `батч N из M`

Финальный отчёт после ответа сервера остаётся на месте. Если запрос завершился ошибкой, progress-блок должен перейти в ошибочное состояние и показать понятный текст, а не просто исчезнуть.

## Data Flow

1. Пользователь нажимает поиск.
2. Фронтенд создаёт `searchId`.
3. Фронтенд подключается к websocket namespace `tgmbase-search` и подписывается на room `searchId`.
4. Фронтенд отправляет HTTP POST `/tgmbase/search` с `searchId`.
5. Бэкенд шлёт прогресс-события по мере обработки батчей.
6. Фронтенд обновляет progress UI по событиям.
7. HTTP-ответ завершает итоговый отчёт; websocket progress переводится в `completed`.

## Error Handling

- Если websocket не подключился, поиск всё равно запускается через HTTP, но progress UI должен показать, что live-прогресс недоступен.
- Если HTTP-запрос завершился ошибкой, прогресс переводится в `failed`.
- Если websocket дал `failed`, фронтенд должен показать это состояние даже до прихода HTTP-ошибки.
- Если `searchId` не передан, бэкенд не обязан публиковать прогресс и должен сохранить текущую совместимость.

## Testing

На бэке нужны unit-тесты на:
- публикацию `started/progress/completed` при поиске на 201+ записей
- корректный `processedQueries` и `currentBatch`
- отсутствие публикации при пустом `searchId`

На фронте нужны тесты на:
- обновление progress-state по socket events
- отправку `searchId` в HTTP-запрос
- отображение прогресса на странице во время pending-состояния
