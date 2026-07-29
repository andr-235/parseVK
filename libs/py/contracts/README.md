# parsevk-contracts

Executable source of truth for ParseVK Kafka contracts.

## Purpose

`parsevk-contracts` is a Python library that serves as the single source of truth for all Kafka message contracts in the ParseVK platform. It provides:

- **Typed message envelopes** with Pydantic validation
- **Immutable contract catalog** — a registry of all message types, their schemas, producers, and consumers
- **Validation boundaries** — `prepare_for_publish` (strict, reject unknown) and `parse_for_consume` (tolerant, ignore unknown) with topic verification, correlation/causation policy enforcement, and typed results
- **Schema generation** — JSON Schema (Draft 2020-12), AsyncAPI 3.1 with send/receive operations, and a deterministic manifest
- **CI drift detection** — generated artifacts are checked into version control and verified in CI

## Dependency

- Python 3.12+
- Pydantic >= 2.12,<3 (only runtime dependency)
- Standard library only beyond Pydantic

## How to define a new contract

1. Create a new payload model in the appropriate domain sub-package (e.g. `parsevk_contracts/vk/commands.py`):

```python
from parsevk_contracts._base import ContractModel

class MyPayload(ContractModel):
    field1: str
    field2: int
```

2. Define a `MessageContract` entry in the same file:

```python
from parsevk_contracts.catalog import MessageContract, PartitionKeySpec

MY_CONTRACT = MessageContract(
    message_type="my.service.command",
    schema_version=1,
    payload_model=MyPayload,
    topic="parsevk.my.service.commands",
    producers=frozenset({"producer-service"}),
    consumers=frozenset({"consumer-service"}),
    partition_key=PartitionKeySpec(paths=("payload.field1",)),
    correlation_required=True,
    correlation_path="payload.field1",
    causation_policy="optional",
    compatibility="backward",
)
```

3. Add the contract to the domain catalog:

```python
from parsevk_contracts.catalog import ContractCatalog
from .commands import MY_CONTRACT

CATALOG = ContractCatalog.from_contracts((MY_CONTRACT,))
```

## How to use the boundary API

### Publishing a message

```python
from uuid import uuid4
from datetime import datetime, timezone
from parsevk_contracts.validation import prepare_for_publish

prepared = prepare_for_publish(
    catalog,
    message_type="vk.execution.requested",
    schema_version=1,
    producer="tasks-service",
    message_id=uuid4(),
    occurred_at=datetime.now(timezone.utc),
    correlation_id=execution_id,
    causation_id=None,
    payload={"executionId": str(execution_id), ...},
)
# prepared.topic      → "parsevk.vk.commands"
# prepared.partition_key → str(execution_id)
# prepared.value      → JSON bytes for Kafka
# prepared.headers    → tuple of (key, bytes) pairs
```

### Consuming a message

```python
from parsevk_contracts.validation import parse_for_consume

parsed = parse_for_consume(
    catalog,
    consumer="vk-service",
    topic="parsevk.vk.commands",
    value=b'{...}',
)
# parsed.envelope.payload is a typed VkExecutionRequested
```

## How to run generation

```bash
# Generate all artifacts (JSON Schema, manifest, AsyncAPI)
uv run python -m parsevk_contracts.generation.cli generate

# Check for drift (fresh generation vs committed)
uv run python -m parsevk_contracts.generation.cli check

# Output directory: generated/
#   generated/json-schema/<message_type>/<schema_version>.json
#   generated/manifest.json
#   generated/asyncapi/parsevk-contracts.yaml
```

## CI drift check

Generated artifacts are committed to the repository. CI verifies that the committed artifacts match the current catalog:

```bash
uv run python -m parsevk_contracts.generation.cli check
```

If the check fails (missing, stale, or changed files), the CI job fails — this ensures that any contract change is accompanied by regenerated artifacts.

## Package structure

```
parsevk_contracts/
    __init__.py
    py.typed              # PEP 561 typed package marker
    _base.py              # ContractModel base class
    envelope.py           # MessageEnvelope generic DTO
    errors.py             # ContractError hierarchy (with stable error codes)
    catalog.py            # MessageContract, PartitionKeySpec, ContractCatalog
    validation.py         # prepare_for_publish / parse_for_consume
    vk/                   # VK domain contracts
    generation/           # JSON Schema, manifest, AsyncAPI generators + drift CLI
```

## License

Same as the ParseVK project.
