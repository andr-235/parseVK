# ADR-007: Realtime Event-Driven Contour

## Status

proposed

## Date

2026-07-27

## Context

The parseVK pipeline produces a large volume of events while VK posts are being
parsed: comments are collected by `vk-service`, projected into `content-service`,
and task execution state changes in `tasks-service`. Frontend clients currently
poll task lists and comment pages to observe progress. Polling is inefficient,
adds latency, and increases load on `content-service` and `tasks-service` as the
number of concurrent users grows.

We need a reactive delivery mechanism that pushes relevant events to the
frontend without coupling the public API to internal Kafka topics or giving
clients direct access to the message bus.

This ADR defines the event contracts, delivery semantics, and the architecture of
the new `realtime-service` that exposes progress via Server-Sent Events (SSE)
proxied through the API Gateway.

## Decision

### Event contracts

Three canonical events drive the realtime contour.

#### 1. `vk.comments_collected` v1

Produced by `vk-service` after each checkpoint page of comments is persisted.

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | UUID | Event identity for deduplication |
| `eventType` | literal `"vk.comments_collected"` | Stable contract name |
| `eventVersion` | 1 | Contract version |
| `batchId` | UUID | Groups all chunks of the same source page |
| `chunkIndex` | int | 0-based chunk index within the batch |
| `chunkCount` | int | Total number of chunks |
| `taskId` | int | Public task identifier |
| `runId` | string | Task run identifier |
| `ownerId` | int | VK owner/group id |
| `postId` | int | VK post id |
| `sourcePosition` | object | Checkpoint offset and page state |
| `comments` | array | Comment snapshots (batch, serialized bounded) |
| `authors` | array | Author snapshots referenced by comments |

Partition key: `vk:{ownerId}:{postId}`.

#### 2. `content.comments_projected` v1

Produced by `content-service` after a batch of comments is projected into its
read model.

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | UUID | Event identity |
| `eventType` | literal `"content.comments_projected"` | |
| `eventVersion` | 1 | |
| `taskId` | int | Public task identifier |
| `runId` | string | Task run identifier |
| `ownerId` | int | VK owner id |
| `postId` | int | VK post id |
| `batchId` | UUID | References `vk.comments_collected` batch |
| `insertedCount` | int | New comments |
| `updatedCount` | int | Updated comments |
| `totalCount` | int | Total comments for the post after projection |
| `projectionRevision` | int | Monotonic projection revision |

Audience: `authenticated` (all authenticated clients).

#### 3. `task.state_changed` v1

Produced by `tasks-service` whenever the authoritative task state is mutated.

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | UUID | Event identity |
| `eventType` | literal `"task.state_changed"` | |
| `eventVersion` | 1 | |
| `taskId` | int | Public task identifier |
| `runId` | string | Current run identifier |
| `ownerUserId` | int | Task owner |
| `status` | string | Task status |
| `taskRevision` | int | Monotonic row revision |
| `processedItems` | int | |
| `totalItems` | int | |
| `progress` | float | 0..1 |
| `stats` | object | Optional extra stats |
| `changedAt` | ISO-8601 | Mutation timestamp |

Audience: `user:{ownerUserId}` (only the task owner sees private task state).

### Partition keys and idempotency guarantees

- Kafka partition keys for `vk.comments_collected` are `vk:{ownerId}:{postId}`
  so that all chunks for the same post are processed sequentially by the same
  content-service consumer partition.
- `content.comments_projected` inherits the same partition key.
- `task.state_changed` uses `user:{ownerUserId}` as the partition key.

Idempotency is enforced at two levels:

1. **Event-level** — each Kafka consumer stores `processed_event` records by
   `event_id`. A duplicate event with the same `event_id` is ignored.
2. **Entity-level** — projections upsert by natural business key
   (`external_id` for comments, `task_id` for task state) using
   `ON CONFLICT DO UPDATE`, so duplicate batches converge to the same row.

### Delivery semantics

The contour uses **at-least-once** delivery:

- Kafka acknowledgments are committed after the consumer transaction commits.
- A crash between the DB commit and the Kafka offset commit causes redelivery.
- `processed_event` and idempotent upserts make redelivery safe.

Realtime delivery to the frontend is best-effort over SSE:

- `realtime-service` persists every ingested event in `realtime_events`.
- Reconnecting clients can replay from `Last-Event-ID`.
- If the cursor is older than the retention window, the service emits a
  `resync_required` event and the client must re-fetch the canonical read model.

### Batch event vs per-comment tradeoffs

We move from one `vk.comment_collected` event per comment to a batched
`vk.comments_collected` event per page.

| Approach | Pros | Cons |
|----------|------|------|
| Per-comment | Simple projection; natural ordering | High Kafka write load; many small events; many consumer round-trips |
| Batch | Fewer events; smaller overhead; easier bulk upsert; simpler realtime fan-out | Larger single payload; need chunking for Kafka limit; sequential processing within batch |

Decision: use batch events. To stay within Kafka message size limits, batch
payloads are chunked with soft limit 512 KiB and hard limit 900 KiB, all sharing
a `batchId`. Legacy per-comment events are kept during the transition behind a
feature flag.

### Content-service outbox decision

`content-service` introduces its own transactional outbox (`outbox_events` table).

- Projection mutation and `content.comments_projected` outbox insertion happen
  in the same database transaction.
- If the service crashes after the transaction commits but before the Kafka
  publish succeeds, the outbox worker will retry the publish.
- This decouples the projection handler from Kafka producer failures and keeps
  the projection state authoritative.

### Realtime-service architecture with LISTEN/NOTIFY

`realtime-service` owns a small PostgreSQL database with one append-only table:

```text
realtime_events
  sequence_id BIGSERIAL PK
  event_id UUID UNIQUE NOT NULL
  event_type TEXT NOT NULL
  event_version INTEGER NOT NULL
  source_topic TEXT NOT NULL
  source_partition INTEGER NULL
  source_offset BIGINT NULL
  audience_type TEXT NOT NULL   -- authenticated | user
  audience_id TEXT NULL         -- user id when audience_type=user
  aggregate_type TEXT NULL
  aggregate_id TEXT NULL
  payload JSONB NOT NULL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + interval '24 hours'
```

Ingestion per Kafka event:

```text
BEGIN
  INSERT INTO realtime_events ... ON CONFLICT(event_id) DO NOTHING
  SELECT sequence_id INTO seq FROM realtime_events WHERE event_id = :eid
  PERFORM pg_notify('realtime_events', seq::text)
COMMIT
commit Kafka offset
```

`ON CONFLICT(event_id) DO NOTHING` makes the consumer idempotent.

SSE clients open a long-lived `LISTEN` connection on the same database. When a new
row is inserted, `pg_notify` wakes all listening instances, and each queries for
events with `sequence_id` greater than the last id sent to that client.

### SSE via API Gateway (no direct exposure)

Frontend clients do not connect to `realtime-service` directly. The public
endpoint is:

```text
GET /api/v1/realtime/stream
```

handled by the API Gateway:

1. Validates JWT via `require_auth`.
2. Extracts `Last-Event-ID` from the browser request.
3. Opens an `httpx.AsyncClient.stream()` to `realtime-service`:
   ```text
   GET /internal/realtime/stream?lastEventId=<id>&audienceType=<type>&audienceId=<id>
   ```
   forwarding `X-Internal-Service-Token`, `X-User-ID`, `X-User-Roles`, and
   `X-Correlation-ID`.
4. Returns a FastAPI `StreamingResponse` with `media_type="text/event-stream"`,
   `Cache-Control: no-cache`, and `X-Accel-Buffering: no`.

Auth failures return 401 before the backend stream is opened. Backend errors are
forwarded as an SSE error event and the connection is closed gracefully.

### Horizontal scaling via shared DB + LISTEN/NOTIFY

Unlike other services that own independent databases, `realtime-service`
instances share one `realtime-db`:

- Every instance ingests Kafka events and writes to the same table.
- Every instance listens on the same `pg_notify` channel.
- `LISTEN/NOTIFY` fan-out wakes all instances; each instance queries only events
  relevant to its connected clients.

Scaling is horizontal:

- Add more `realtime-service` replicas behind the gateway load balancer.
- Shared state avoids per-instance Kafka partition assignment and simplifies
  replay: any instance can serve any client.

### Sequence diagram

```text
  vk-service                content-service          realtime-service       api-gateway         frontend
      |                           |                         |                    |               |
      | vk.comments_collected     |                         |                    |               |
      |---------------------------|>                        |                    |               |
      |                           | project + outbox insert |                    |               |
      |                           |-------------------------|>                   |               |
      |                           |                         | pg_notify          |               |
      |                           |                         |                    |               |
      |                           |                         |<----LISTEN/notify---|               |
      |                           |                         |                    | SSE stream    |
      |                           |                         |<--------------------|<--------------|
      |                           |                         |                    |               |
      |                           |                         |<----SSE events---->|-------------->|
```

## Consequences

### Positive

- Frontend no longer needs to poll; comments and task progress update reactively.
- Kafka load drops because batch events replace many per-comment events.
- `content-service` owns authoritative projection events through its own outbox.
- `realtime-service` is stateless except for the shared DB, so it scales
  horizontally without Kafka partition rebalancing.
- Replay and resync semantics protect clients against reconnections and missed
  events.

### Negative

- `realtime-service` introduces a shared database, which is an exception to the
  database-per-service rule. The tradeoff is accepted because the table is a
  transient fan-out buffer, not a business domain owner.
- Shared DB can become a throughput bottleneck if the event volume is extremely
  high; retention window and indexing must be monitored.
- SSE requires long-lived connections, complicating load balancer idle timeout
  configuration.
- Frontend must implement client-side deduplication, exponential backoff, and
  resync handling.

### Migration path

1. Add event contracts to `libs/py/common`.
2. Update `vk-service` to emit batch events while keeping legacy events behind a
   flag.
3. Add `content-service` outbox and batch projection.
4. Create `realtime-service` and its database.
5. Add SSE proxy endpoint to `api-gateway`.
6. Build frontend `RealtimeClient`, `RealtimeProvider`, and React Query integration.
7. Add feature flags (`VK_BATCH_EVENTS_ENABLED`, `VK_LEGACY_COMMENT_EVENTS_ENABLED`,
   `CONTENT_PROJECTION_EVENTS_ENABLED`, `REALTIME_SERVICE_ENABLED`,
   `FRONTEND_REALTIME_ENABLED`) and remove legacy events once stable.

## Alternatives considered

### WebSocket instead of SSE

Rejected. SSE is sufficient for one-way server-to-client push, reconnects with
`Last-Event-ID` are natively supported, and it works through standard HTTP proxies
without WebSocket upgrade handling.

### Direct Kafka access from frontend

Rejected. Exposing Kafka topics to browsers would leak internal event contracts
and bypass authentication/authorization controls.

### Per-instance in-memory event buffer

Rejected. Replicas would diverge on reconnect: a client could land on an instance
that missed the event it was trying to replay. Shared DB solves this uniformly.

## Configuration & Feature Flags

The following feature flags control the behavior of the realtime event-driven contour:

| Flag | Service | Default | Purpose |
|------|---------|---------|---------|
| `VK_SERVICE_VK_BATCH_EVENTS_ENABLED` | vk-service | `true` | Enable batch `vk.comments_collected` events (dual-emit with legacy) |
| `VK_SERVICE_VK_LEGACY_COMMENT_EVENTS_ENABLED` | vk-service | `true` | Keep legacy per-comment `vk.comment_collected` events active |
| `CONTENT_KAFKA_CONSUMER_ENABLED` | content-service | `false` | Enable Kafka consumer for projection events |
| `CONTENT_CONTENT_PROJECTION_EVENTS_ENABLED` | content-service | `true` | Enable `content.comments_projected` outbox events |
| `REALTIME_KAFKA_CONSUMER_ENABLED` | realtime-service | `false` | Enable Kafka consumer in realtime-service |
| `REALTIME_REALTIME_SERVICE_ENABLED` | realtime-service | `true` | Master switch for realtime-service features |
| `VITE_REALTIME_ENABLED` | frontend | `true` | Enable frontend SSE connection to realtime stream |

## Links

- Issue: https://github.com/andr-235/parseVK/issues/XXX
- Plan: `.ai-factory/plans/pr-p2b-realtime-contour.md`
- Related ADR: `docs/adr/ADR-0007-source-integration-vs-canonical-content-ownership.md`
