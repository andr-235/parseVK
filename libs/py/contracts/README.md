# parsevk-contracts

Executable source of truth for ParseVK Kafka contracts.

## Purpose

`parsevk-contracts` is a Python library that serves as the single source of truth for all Kafka message contracts in the ParseVK platform. It provides:

- **Typed message envelopes** with Pydantic validation
- **Immutable contract catalog** — a registry of all message types, their schemas, producers, and consumers
- **Validation boundaries** — strict validation for producers (reject unknown fields), tolerant validation for consumers (ignore unknown fields)
- **Schema generation** — JSON Schema (Draft 2020-12), AsyncAPI 3.1, and a deterministic manifest
- **CI drift detection** — generated artifacts are checked into version control and verified in CI

## Dependency

- Python 3.12+
- Pydantic >= 2.8 (only runtime dependency)
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
    causation_policy="optional",
    compatibility="backward",
)
```

3. Add the contract to the domain catalog tuple in `__init__.py`:

```python
from parsevk_contracts.catalog import ContractCatalog
from .commands import MY_CONTRACT

CATALOG = ContractCatalog.from_contracts((MY_CONTRACT,))
```

## How to add to the global catalog

Each domain sub-package exposes a `CATALOG` constant. The global catalog is assembled by combining all domain catalogs. This is done in the generation entry point.

## How to run generation

```bash
# Generate all artifacts (JSON Schema, manifest, AsyncAPI)
uv run python -m parsevk_contracts.generation

# Output directory: generated/
#   generated/json-schema/<message_type>/<schema_version>.json
#   generated/manifest.json
#   generated/asyncapi/parsevk-contracts.yaml
```

## CI drift check

Generated artifacts are committed to the repository. CI verifies that the committed artifacts match the current catalog:

```bash
uv run python -m parsevk_contracts.generation
git diff --exit-code generated/
```

If the diff is non-empty, the CI job fails — this ensures that any contract change is accompanied by regenerated artifacts.

## Package structure

```
parsevk_contracts/
    __init__.py
    py.typed              # PEP 561 typed package marker
    _base.py              # ContractModel base class
    envelope.py           # MessageEnvelope generic DTO
    errors.py             # ContractError hierarchy
    catalog.py            # MessageContract, PartitionKeySpec, ContractCatalog
    validation.py         # produce/consume validation boundaries
    vk/                   # VK domain contracts
    content/              # Content domain contracts
    access/               # Access domain contracts
    media/                # Media domain contracts
    social_graph/         # Social graph domain contracts
    generation/           # JSON Schema, manifest, AsyncAPI generators
```

## License

Same as the ParseVK project.
