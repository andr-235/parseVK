# ADR-0008: Unversioned semantic Kafka message contracts

- Status: Accepted
- Date: 2026-08-05
- Epic: #281
- Hardening issue: #421
- Supersedes: numeric `schemaVersion` assumptions from the original #282 description

## Context

The first contracts baseline described identities as `(messageType, schemaVersion)` and generated numeric schema paths. The production contract runtime was later simplified during the P2 hard cutover:

- `MessageEnvelope` no longer contains `schemaVersion`;
- `ContractCatalog` is keyed by one semantic `message_type`;
- generated schemas use `generated/json-schema/<message_type>.json`;
- producers and consumers route by semantic message type and topic;
- version directories, numeric schema files and the compatibility package were removed.

Documentation and Full Release CI continued to describe or invoke the removed versioned model. Keeping both policies would make P3 contract evolution ambiguous and could let a release pass one gate while failing another.

## Decision

ParseVK Kafka contracts use an **unversioned envelope and semantic message identity**.

A contract identity consists of:

```text
message_type + topic + partition-key policy
```

There is no numeric schema version in the envelope, catalog API, generated path or Kafka header.

### Compatible evolution

The same `message_type` may be retained only for backward-compatible additive evolution. In particular:

- optional payload fields may be added;
- producer and consumer allow-lists may be expanded;
- descriptions, titles and non-semantic generation metadata may change;
- constraints may be relaxed when old valid messages remain valid.

The following changes are breaking under the same semantic identity:

- adding a required field;
- removing or renaming a field;
- changing an accepted field type;
- narrowing enum, const, length, numeric or collection constraints;
- changing topic, partition key, correlation policy or causation policy;
- removing an authorized producer or consumer;
- removing the message type.

### Incompatible evolution

An incompatible contract requires a **new semantic message type whose name describes the new business meaning**. Numeric suffixes such as `_v2`, `.v2`, `/2` and restored `schemaVersion` routing are forbidden.

Example:

```text
old: vk.execution.requested
new: vk.collection.requested
```

Both identities may coexist only for an explicit migration window with:

- named producers and consumers;
- separate generated schemas;
- an ADR or cutover note;
- replay, ordering and rollback rules;
- removal criteria for the old identity.

A breaking schema must never silently replace the old schema under the same `message_type`.

## Enforcement

The contracts policy gate must run in both pull-request CI and Full Release CI. It must:

1. validate the unversioned repository layout;
2. reject `schemaVersion`, `schema_version`, numeric version directories/files and a compatibility runtime package in executable contract sources and generated artifacts;
3. compare generated manifests against the baseline;
4. reject removed identities and immutable routing metadata changes;
5. reject backward-incompatible schema changes under an existing semantic identity;
6. execute documented README examples against the current package.

Generated artifact drift and registry metadata validation remain separate mandatory checks.

## Consequences

### Positive

- one routing identity exists at runtime;
- contracts, generated artifacts and Kafka records cannot disagree about a version number;
- breaking changes are visible as explicit topology and migration work;
- old and new meanings cannot be confused merely because they share a string plus an integer.

### Negative

- incompatible evolution requires a new message name and an explicit migration;
- compatibility analysis must understand additive schema changes rather than comparing numeric versions;
- semantic naming requires more thought than appending `v2`, a burden humanity will somehow endure.

## Rejected alternatives

### Restore numeric `schemaVersion`

Rejected because the current runtime, generated layout and deployed P2 commands already use one semantic identity. Restoring the field would recreate compatibility branches solely to preserve obsolete documentation.

### Allow arbitrary breaking replacement under one message type

Rejected because retained Kafka records, retries and lagging consumers would become undecodable without an observable routing change.

### Use an external Schema Registry now

Rejected as outside the epic scope. The repository remains the executable source of truth; an external registry may be proposed separately if operational requirements justify it.
