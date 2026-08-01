"""Shared canonical-source resolution used by sources module services."""

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
    """Resolve an identity and return the matching registered source.

    Both the stable id and canonical identity fields must match. This prevents
    a resolver or caller mismatch from silently attaching the wrong source.
    """
    logger.debug("Resolving source identity: %s", identity)
    try:
        resolved = await resolver.resolve(identity)
    except SourceNotFoundError as exc:
        logger.warning(
            "Rejected untrusted identity: provider=%s type=%s external=%s (%s)",
            identity.provider,
            identity.source_type,
            identity.external_id,
            exc,
        )
        raise
    except ResolverError:
        logger.error("Unexpected resolver failure for identity %s", identity, exc_info=True)
        raise

    source = await sources_repo.get_source_by_identity(
        resolved.provider,
        resolved.source_type,
        resolved.external_id,
    )
    if source is None:
        raise SourceNotFoundError("Resolved source is not registered")
    if source.id != resolved.source_id or source.owner_id != resolved.owner_id:
        logger.error(
            "Canonical source mismatch: stored=%s resolved=%s",
            source.id,
            resolved.source_id,
        )
        raise ResolverError("Stored source does not match resolver identity")
    return source
