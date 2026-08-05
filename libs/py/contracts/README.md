# parsevk-contracts

Executable source of truth for ParseVK Kafka contracts.

## Contract identity policy

ParseVK uses an **unversioned envelope and semantic message identity**. A contract is identified by its `message_type`, topic and partition-key policy. There is no numeric schema version in the envelope, catalog API, generated path or Kafka headers.

- Backward-compatible additive changes keep the same `message_type`.
- Breaking changes require a new semantic message type and an explicit migration plan.
- Numeric names such as `_v2`, `.v2` or `/2`, numeric schema files and restored `schemaVersion` routing are forbidden.

The complete decision and compatibility rules are recorded in [ADR-0008](../../../docs/adr/ADR-0008-unversioned-semantic-message-contracts.md).

## Purpose

`parsevk-contracts` provides:

- typed Pydantic payloads and envelopes;
- an immutable catalog of message types, topics, producers and consumers;
- strict producer validation through `prepare_for_publish`;
- tolerant consumer validation through `parse_for_consume`;
- deterministic JSON Schema, manifest and AsyncAPI generation;
- registry, layout, evolution and generated-artifact CI gates.

## Dependencies

- Python 3.12+
- runtime: Pydantic >= 2.12,<3
- generation extra: PyYAML >= 6,<7

## Define a contract

Create a payload model and one semantic catalog entry:

```python
from uuid import UUID

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import MessageContract, PartitionKeySpec


class MyCommand(ContractModel):
    execution_id: UUID
    description: str | None = None


MY_COMMAND = MessageContract(
    message_type="my.service.command",
    payload_model=MyCommand,
    topic="parsevk.my.service.commands",
    producers=frozenset({"producer-service"}),
    consumers=frozenset({"consumer-service"}),
    partition_key=PartitionKeySpec(paths=("payload.executionId",)),
    correlation_required=True,
    correlation_path="payload.executionId",
    causation_policy="forbidden",
)
```

Add the entry to its domain `ContractCatalog`, re-export that catalog from the domain package and include it in `parsevk_contracts/generation/cli.py`.

## Executable publish/consume example

The producer boundary accepts Python-native values and snake_case payload keys. Wire serialization converts aliases to camelCase. The consumer boundary validates the topic and authorized consumer, ignores additive unknown fields and returns a typed payload.

<!-- executable-contract-example:start -->
```python
from datetime import UTC, datetime
from uuid import uuid4

from parsevk_contracts.validation import parse_for_consume, prepare_for_publish
from parsevk_contracts.vk.commands import CATALOG, VkExecutionRequested

execution_id = uuid4()
task_run_id = uuid4()
source_id = uuid4()

prepared = prepare_for_publish(
    CATALOG,
    message_type="vk.execution.requested",
    producer="tasks-service",
    message_id=uuid4(),
    occurred_at=datetime.now(UTC),
    correlation_id=execution_id,
    causation_id=None,
    payload={
        "task_id": 42,
        "task_run_id": task_run_id,
        "execution_id": execution_id,
        "owner_user_id": "user-42",
        "demands": (
            {
                "demand_id": uuid4(),
                "source": {
                    "source_id": source_id,
                    "provider": "vk",
                    "source_type": "community",
                    "external_id": "123",
                    "owner_id": -123,
                },
            },
        ),
        "post_selection": {
            "strategy": "latestByPublishedAt",
            "limit_per_source": 25,
        },
        "comment_selection": {
            "mode": "all",
            "include_thread_replies": True,
        },
        "task_revision": 7,
        "source_set_revision": 3,
        "snapshot_sha256": "a" * 64,
    },
)

parsed = parse_for_consume(
    CATALOG,
    consumer="vk-service",
    topic=prepared.topic,
    value=prepared.value,
)

assert prepared.partition_key == str(execution_id)
assert isinstance(parsed.envelope.payload, VkExecutionRequested)
assert parsed.envelope.payload.task_run_id == task_run_id
assert "schemaVersion" not in prepared.envelope.to_wire()
```
<!-- executable-contract-example:end -->

## Generate and validate artifacts

Install development/generation dependencies:

```bash
uv sync --group dev --frozen
```

Generate committed artifacts:

```bash
uv run python -m parsevk_contracts.generation.cli generate
```

Generated layout:

```text
generated/
  json-schema/<message_type>.json
  manifest.json
  asyncapi/parsevk-contracts.yaml
```

Validate the catalog, policy and generated files:

```bash
uv run python -m parsevk_contracts.generation.cli validate-registry
uv run python -m parsevk_contracts.generation.cli validate-policy
uv run python -m parsevk_contracts.generation.cli check
```

Compare the current generated contracts with a baseline checkout:

```bash
uv run python -m parsevk_contracts.generation.cli check-evolution \
  --baseline /path/to/baseline/generated \
  --current generated
```

The evolution check permits optional additive fields and relaxed constraints. It rejects removed identities, required-field additions, removed fields, narrowed constraints, routing-policy changes and producer/consumer removals under an existing message type.

Exit codes:

- `0`: checks passed;
- `1`: policy, compatibility or drift violations;
- `2`: operational error such as an unreadable manifest.

## Package structure

```text
parsevk_contracts/
  _base.py
  envelope.py
  errors.py
  catalog.py
  validation.py
  vk/
  sources/
  generation/
  py.typed
```

## Registered contracts

| Message type | Topic | Producer | Consumer | Purpose |
|---|---|---|---|---|
| `vk.execution.requested` | `parsevk.vk.commands` | tasks-service | vk-service | Start one immutable TaskRun command |
| `vk.execution.cancel_requested` | `parsevk.vk.commands` | tasks-service | vk-service | Cancel one TaskRun binding |
| `sources.access.granted` | `parsevk.sources.events` | tasks-service | vk-service | Grant source access to a scope |
| `sources.access.revoked` | `parsevk.sources.events` | tasks-service | vk-service | Revoke source access with a tombstone |

Source access events are declared now but their downstream projection is enabled in a later epic phase.

## License

Same as the ParseVK project.
