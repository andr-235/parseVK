# parsevk-contracts Glossary

Canonical definitions for domain concepts used in ParseVK event contracts.

## Workflow concepts

- **Task** — A user-defined monitoring specification owned by tasks-service.
- **TaskRun** — One concrete trigger of a Task with an immutable source and configuration snapshot. A terminal TaskRun is never reopened.
- **TaskRunSourceDemand** — One source-specific work item within a TaskRun.

## VK execution concepts

- **VkTaskRunBinding** — The vk-service projection of one immutable TaskRun command. It aggregates independent source demands and owns TaskRun-level lifecycle attribution.
- **VkSourceCollection** — One physical VK collection aggregate identified by provider account, normalized source key and exact collection-plan fingerprint. Multiple compatible TaskRuns may share it while pending or running.
- **VkCollectionDemand** — One TaskRun's independent demand attached to a VkSourceCollection. Cancelling it does not stop shared work while another active demand remains.
- **Collection fingerprint** — A deterministic SHA-256 digest of provider account, normalized source identity and immutable collection plan. Coalescing requires exact equality.
- **VkExecution** — The logical worker execution for one VkSourceCollection. It survives worker crashes and reaches one terminal outcome.
- **VkExecutionAttempt** — One physical worker attempt with a lease, heartbeat, attempt number and fencing token.
- **Fencing token** — A monotonically increasing ownership token. A stale attempt cannot heartbeat, commit checkpoints, emit terminal effects or change execution state.

## Content concepts

- **SourceCollection** — A canonical content collection owned by content-service. It is distinct from vk-service's orchestration aggregate `VkSourceCollection`.
- **SourceCollectionId** — The content-service identifier used to correlate ingestion delivery and receipts.

## Source access concepts

- **MonitoringSource** — A normalized global source identity, unique by provider, source type and external ID. Owned by tasks-service.
- **AccessScope** — A user-owned group of source grants. Its identifier is distinct from `createdByUserId`.
- **SourceAccessGranted** — `sources.access.granted`, published when a source is granted to an access scope.
- **SourceAccessRevoked** — `sources.access.revoked`, a tombstone published when access is revoked.
- **Access revision** — A monotonic revision used to reject stale access events.
- **VkSourceResolver** — Internal contract for resolving provider, source type and external ID to canonical source identity and access metadata.

## Message metadata

- **messageId** — Globally unique message identifier used for inbox deduplication.
- **messageType** — Stable semantic routing identity, such as `vk.execution.requested`. It is not paired with a numeric schema version.
- **producer** — Named service that emitted the envelope and is authorized by the contract catalog.
- **occurredAt** — UTC timestamp at which the message was produced.
- **batchId** — Optional domain-level batch identity carried by payloads that define batching.
- **sourceId** — Domain identifier of a normalized monitoring source. Do not confuse it with a content SourceCollectionId.

## Correlation identifiers

- **correlationId** — Root workflow identity shared by messages in one workflow chain. For VK root commands it equals `executionId`.
- **causationId** — Immediate parent message identifier. Its required, optional or forbidden policy is declared per contract.

## Contract infrastructure

- **MessageContract** — Immutable catalog entry declaring semantic message type, payload model, topic, producers, consumers, partition key and correlation/causation rules.
- **ContractCatalog** — Immutable registry keyed by one semantic `message_type`.
- **PartitionKey** — Deterministic string computed from envelope or payload fields for Kafka partition assignment.
- **Generated contract schema** — Flat JSON Schema artifact at `generated/json-schema/<message_type>.json`.
- **Additive evolution** — Change under the same message type that keeps old messages readable, such as an optional field or relaxed constraint.
- **Breaking evolution** — Change that invalidates old messages or changes routing/ownership metadata. It requires a new semantic message type and explicit cutover plan.
- **Semantic replacement** — New message type describing a new business meaning, for example replacing `vk.execution.requested` with `vk.collection.requested`. Numeric suffixes are not a versioning mechanism.
- **Contract policy gate** — CI checks that enforce the unversioned layout and compare generated schemas/manifests with a baseline.
- **Producer** — Service authorized to publish a message type.
- **Consumer** — Service authorized to consume a message type.

The binding policy is defined by `docs/adr/ADR-0008-unversioned-semantic-message-contracts.md`.
