from datetime import UTC
from uuid import UUID

from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_part_diagnostics import (
    OversizedIngestionDiagnostic,
)
from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.domain.repositories.ingestion_part_diagnostics import (
    OversizedDiagnosticConflictError,
)
from app.infrastructure.db.models.ingestion_part_diagnostics import (
    VkIngestionOversizedDiagnostic,
)


class SqlAlchemyOversizedDiagnosticRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def record(
        self,
        diagnostic: OversizedIngestionDiagnostic,
    ) -> tuple[OversizedIngestionDiagnostic, bool]:
        values = {
            "id": diagnostic.diagnostic_id,
            "batch_id": diagnostic.batch_id,
            "item_kind": diagnostic.item_kind,
            "item_identity": diagnostic.item_identity,
            "staging_schema_version": diagnostic.versions.staging_schema,
            "packing_version": diagnostic.versions.packing,
            "event_contract_version": diagnostic.versions.event_contract,
            "wire_bytes_count": diagnostic.wire_bytes_count,
            "hard_limit_bytes": diagnostic.hard_limit_bytes,
            "reason": diagnostic.reason,
            "status": diagnostic.status,
            "created_at": diagnostic.created_at,
        }
        dialect = self.session.get_bind().dialect.name
        if dialect == "postgresql":
            statement = postgresql_insert(VkIngestionOversizedDiagnostic).values(
                **values
            )
        elif dialect == "sqlite":
            statement = sqlite_insert(VkIngestionOversizedDiagnostic).values(**values)
        else:
            raise RuntimeError(f"unsupported diagnostic dialect: {dialect}")
        result = await self.session.execute(statement.on_conflict_do_nothing())
        stored = await self.get(diagnostic.diagnostic_id)
        if stored is None:
            raise RuntimeError("oversized diagnostic insert did not resolve to a row")
        self._verify(stored, diagnostic)
        return stored, result.rowcount == 1

    async def get(
        self,
        diagnostic_id: UUID,
    ) -> OversizedIngestionDiagnostic | None:
        model = await self.session.get(
            VkIngestionOversizedDiagnostic,
            diagnostic_id,
        )
        return self._to_domain(model) if model is not None else None

    @staticmethod
    def _verify(
        stored: OversizedIngestionDiagnostic,
        expected: OversizedIngestionDiagnostic,
    ) -> None:
        comparable_stored = (
            stored.diagnostic_id,
            stored.batch_id,
            stored.item_kind,
            stored.item_identity,
            stored.versions,
            stored.wire_bytes_count,
            stored.hard_limit_bytes,
            stored.reason,
            stored.status,
        )
        comparable_expected = (
            expected.diagnostic_id,
            expected.batch_id,
            expected.item_kind,
            expected.item_identity,
            expected.versions,
            expected.wire_bytes_count,
            expected.hard_limit_bytes,
            expected.reason,
            expected.status,
        )
        if comparable_stored != comparable_expected:
            raise OversizedDiagnosticConflictError(
                "oversized diagnostic identity contains incompatible evidence"
            )

    @staticmethod
    def _to_domain(
        model: VkIngestionOversizedDiagnostic,
    ) -> OversizedIngestionDiagnostic:
        created_at = model.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=UTC)
        return OversizedIngestionDiagnostic(
            diagnostic_id=model.id,
            batch_id=model.batch_id,
            item_kind=model.item_kind,
            item_identity=model.item_identity,
            versions=IngestionPartVersions(
                staging_schema=model.staging_schema_version,
                packing=model.packing_version,
                event_contract=model.event_contract_version,
            ),
            wire_bytes_count=model.wire_bytes_count,
            hard_limit_bytes=model.hard_limit_bytes,
            reason=model.reason,
            created_at=created_at,
            status=model.status,
        )
