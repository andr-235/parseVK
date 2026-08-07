"""VK domain contracts."""

from parsevk_contracts.catalog import ContractCatalog
from parsevk_contracts.vk.commands import CATALOG as VK_COMMANDS_CATALOG
from parsevk_contracts.vk.ingestion import CATALOG as VK_INGESTION_CATALOG

VK_CATALOG = ContractCatalog.from_contracts(
    VK_COMMANDS_CATALOG.contracts + VK_INGESTION_CATALOG.contracts
)

__all__ = ["VK_CATALOG", "VK_COMMANDS_CATALOG", "VK_INGESTION_CATALOG"]
