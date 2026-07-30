from __future__ import annotations

from parsevk_contracts.catalog import ContractCatalog
from parsevk_contracts.registry_validation.models import RegistryViolation
from parsevk_contracts.registry_validation.rules import check_contract


def validate_registry(
    catalog: ContractCatalog,
) -> tuple[RegistryViolation, ...]:
    """Validate all contracts in a catalog for metadata completeness.

    Returns all violations found (empty tuple means the registry is valid).
    """
    violations: list[RegistryViolation] = []

    for contract in catalog.contracts:
        check_contract(contract, violations)

    return tuple(violations)