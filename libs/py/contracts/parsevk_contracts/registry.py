from parsevk_contracts.catalog import ContractCatalog
from parsevk_contracts.content import CATALOG as CONTENT_CATALOG
from parsevk_contracts.sources import SOURCES_CATALOG
from parsevk_contracts.vk.commands import CATALOG as VK_CATALOG
from parsevk_contracts.vk.ingestion import CATALOG as VK_INGESTION_CATALOG

CATALOG = ContractCatalog.from_contracts(
    VK_CATALOG.contracts
    + VK_INGESTION_CATALOG.contracts
    + SOURCES_CATALOG.contracts
    + CONTENT_CATALOG.contracts
)
