"""Shared canonical-source resolution used by sources module services.

External identities are NEVER trusted without resolver validation
(issue #283 AC). Both the sources and the access-scope services resolve
identities through the same path so rejection semantics stay identical.
"""

import logging

from app.db.models import MonitoringSource
from app.modules.sources.repository import SourcesRepository
from app.modules.sources.resolver import (
    ResolverError,
    SourceIdentity,
    SourceNotFoundError,
)

logger = logging.getLogger(__name__)


async def canonical_source(
    resolver, sources_repo: SourcesRepository, identity: SourceIdentity
) -> MonitoringSource:
    """Resolve a normalized identity to a registered canonical source."""
    logger.debug("Resolving source identity: %s", identity)
    try:
        resolved = await resolver.resolve(identity)
    except SourceNotFoundError as exc:
        logger.warning(
            "Rejected untrusted identity: provider=%s type=%s external=%s (%s)",
            identity.provider, identity.source_type, identity.external_id, exc,
        )
        raise
    except ResolverError:
        logger.error(
            "Unexpected resolver failure for identity %s", identity, exc_info=True
        )
        raise

    source = await sources_repo.get_source_by_id(resolved.source_id)
    if source is None:
        logger.warning(
            "Resolver returned unknown source_id=%s for identity %s",
            resolved.source_id, identity,
        )
        raise SourceNotFoundError("Resolved source is not registered")
    return source
