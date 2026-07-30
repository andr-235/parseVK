from pathlib import Path

from .catalog import Catalog
from .errors import CatalogError
from .git_changes import executable, git_changed_files
from .matrices import deploy_targets, service_matrix
from .paths import path_matches
from .repository import validate_repository
from .schema import PURPOSES
from .service import Migration, Service

CATALOG_PATH = Path(".github/service-catalog.yaml")

__all__ = [
    "CATALOG_PATH", "Catalog", "CatalogError", "Migration", "PURPOSES", "Service",
    "deploy_targets", "executable", "git_changed_files", "path_matches",
    "service_matrix", "validate_repository",
]
