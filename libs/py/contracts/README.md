# parsevk-contracts

Executable source of truth for ParseVK Kafka contracts.

## Purpose

`parsevk-contracts` is a Python library that serves as the single source of truth for all Kafka message contracts in the ParseVK platform. It provides:

- **Typed message envelopes** with Pydantic validation
- **Immutable contract catalog** — a registry of all message types, their schemas, producers, and consumers
- **Validation boundaries** — `prepare_for_publish` (strict, reject unknown) and `parse_for_consume` (tolerant, ignore unknown) with topic verification, correlation/causation policy enforcement, and typed results
- **Schema generation** — JSON Schema (Draft 2020-12), AsyncAPI 3.1 with send/receive operations, and a deterministic manifest
- **CI drift detection** — generated artifacts are checked into version control and verified in CI

## Dependencies

- Python 3.12+
- **Core runtime:** Pydantic >= 2.12,<3
- **Generation extra (`pip install "parsevk-contracts[generation]"`):** PyYAML >= 6,<7

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

4. Re-export the catalog from the domain package `__init__.py` so the
   generation CLI drift-check and registry validation see the new contracts:

```python
# parsevk_contracts/<domain>/__init__.py
from parsevk_contracts.<domain>.commands import CATALOG as DOMAIN_CATALOG

__all__ = ["DOMAIN_CATALOG"]
```

The generation CLI (`parsevk_contracts/generation/cli.py`) merges the
catalogs of all registered domains into a single catalog used for
generation, drift-check, and registry validation. New domains must be
added there as well.

## How to use the boundary API

### Publishing a message

The producer API expects **Python-native types** with **snake_case keys**
— pass ``UUID`` objects, ``int``, ``bool``, etc. directly, not their
string representations. The payload dict uses Python field names, not
wire-format camelCase; serialization to camelCase happens automatically.

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
    payload={
        "task_id": task_id,
        "task_run_id": task_run_id,
        "execution_id": execution_id,
        "demands": demands,
        "post_selection": post_selection_dict,
        "comment_selection": comment_selection_dict,
        "task_revision": 1,
        "source_set_revision": 1,
        "snapshot_sha256": sha256_hex,
    },
)
# prepared.topic      → "parsevk.vk.commands"
# prepared.partition_key → str(execution_id)
# prepared.value      → JSON bytes for Kafka (camelCase)
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

Requires the `generation` extra:

```bash
# Install with generation dependencies
pip install "parsevk-contracts[generation]"
# or with uv:
uv sync --extra generation

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

## CLI Commands

The CLI supports four commands:

### generate
Generate JSON Schema, manifest, and AsyncAPI artifacts:

```bash
uv run python -m parsevk_contracts.generation.cli generate
```

### check
Verify that committed generated artifacts match the current catalog (drift detection):

```bash
uv run python -m parsevk_contracts.generation.cli check
```

### validate-registry
Validate that all registered contracts have complete metadata — non-empty producers/consumers, valid schema version, accessible partition/correlation paths, and supported policy values:

```bash
uv run python -m parsevk_contracts.generation.cli validate-registry
```

### compatibility
Compare generated contract artifacts against a baseline (e.g. from the `main` branch). Detects removed identities, schema changes, and immutable field modifications:

```bash
uv run python -m parsevk_contracts.generation.cli compatibility \
  --baseline /path/to/baseline/generated \
  --current generated
```

Exit codes:
- `0` — all checks passed
- `1` — violations found (details on stderr)
- `2` — operational error (missing files, invalid JSON)

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
    sources/              # Source domain contracts (access change events)
    generation/           # JSON Schema, manifest, AsyncAPI generators + drift CLI
```

## Registered contracts

| Message type | Topic | Producers | Consumers | Notes |
|--------------|-------|-----------|-----------|-------|
| `vk.execution.requested` | `parsevk.vk.commands` | tasks-service | vk-service | Execution command with immutable task/source snapshot refs |
| `sources.access.granted` | `parsevk.sources.events` | tasks-service | vk-service (declared) | Source granted to an access scope; consumers disabled until a later phase |
| `sources.access.revoked` | `parsevk.sources.events` | tasks-service | vk-service (declared) | Source revoked from an access scope (tombstone); consumers disabled until a later phase |

Source access events partition on `payload.sourceId`, so all events for one
source land in the same partition. The declared consumer (`vk-service`) is
registered in the catalog for schema evolution and registry validation but is
NOT wired to consume yet — downstream consumers are enabled in later phases.

### VK source resolver contract

`parsevk_contracts/vk/resolver.py` defines the internal VK source resolver
data contract used to validate frontend-supplied normalized identities
(`VkSourceResolverRequest` → `VkSourceResolverResponse`). The response reuses
`SourceReference` for the identity shape and adds the canonical access scope
plus source/scope revisions. The actual resolution is implemented behind the
source resolver port in tasks-service in a later phase.

## License

Same as the ParseVK project.
