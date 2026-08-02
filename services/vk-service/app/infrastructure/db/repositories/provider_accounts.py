import logging
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    ACCOUNT_STATUS_INVALID,
    ProviderAccount,
)
from app.domain.repositories.provider_accounts import ProviderAccountRepository
from app.infrastructure.db.models.provider_accounts import VkProviderAccount

logger = logging.getLogger(__name__)


def _to_entity(model: VkProviderAccount) -> ProviderAccount:
    return ProviderAccount(
        id=model.id,
        account_key=model.account_key,
        provider=model.provider,
        status=model.status,
        credential_version=model.credential_version,
        capabilities=list(model.capabilities or []),
        cooldown_until=model.cooldown_until,
        last_error_code=model.last_error_code,
        last_error_kind=model.last_error_kind,
        last_validated_at=model.last_validated_at,
        revision=model.revision,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


class SqlAlchemyProviderAccountRepository(ProviderAccountRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_key(self, account_key: str) -> ProviderAccount | None:
        logger.debug("get provider account by key %s", account_key)
        model = await self.session.scalar(
            select(VkProviderAccount).where(VkProviderAccount.account_key == account_key)
        )
        return _to_entity(model) if model is not None else None

    async def upsert_system(
        self,
        *,
        account_key: str,
        provider: str,
        credential_version: str,
        capabilities: list[str] | None = None,
    ) -> ProviderAccount:
        logger.debug("upsert system provider account %s", account_key)
        values = {
            "account_key": account_key,
            "provider": provider,
            "credential_version": credential_version,
            "capabilities": capabilities or [],
        }
        stmt = (
            pg_insert(VkProviderAccount)
            .values(**values)
            .on_conflict_do_update(
                constraint="uq_vk_provider_accounts_account_key",
                set_={
                    "provider": provider,
                    "credential_version": credential_version,
                    "capabilities": capabilities or [],
                },
            )
            .returning(VkProviderAccount)
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one()
        return _to_entity(model)

    async def transition_to_invalid(
        self,
        account_id: UUID,
        credential_version: str,
        *,
        error_code: int | None = None,
        error_kind: str | None = None,
    ) -> bool:
        stmt = (
            update(VkProviderAccount)
            .where(
                VkProviderAccount.id == account_id,
                VkProviderAccount.credential_version == credential_version,
                VkProviderAccount.status != ACCOUNT_STATUS_INVALID,
            )
            .values(
                status=ACCOUNT_STATUS_INVALID,
                last_error_code=error_code,
                last_error_kind=error_kind,
            )
            .returning(VkProviderAccount.id)
        )
        result = await self.session.execute(stmt)
        became_invalid = result.scalar_one_or_none() is not None
        logger.debug("transition account %s to invalid (version match=%s)", account_id, became_invalid)
        return became_invalid

    async def set_cooldown(self, account_id: UUID, until: datetime) -> None:
        logger.debug("set cooldown for account %s until %s", account_id, until)
        await self.session.execute(
            update(VkProviderAccount)
            .where(VkProviderAccount.id == account_id)
            .values(status="cooling_down", cooldown_until=until)
        )

    async def mark_active(
        self,
        account_id: UUID,
        credential_version: str,
        capabilities: list[str],
    ) -> ProviderAccount | None:
        stmt = (
            update(VkProviderAccount)
            .where(VkProviderAccount.id == account_id)
            .values(
                status=ACCOUNT_STATUS_ACTIVE,
                credential_version=credential_version,
                capabilities=capabilities,
                cooldown_until=None,
                last_error_code=None,
                last_error_kind=None,
                revision=VkProviderAccount.revision + 1,
            )
            .returning(VkProviderAccount)
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        logger.debug("mark account %s active (revision bump)", account_id)
        return _to_entity(model) if model is not None else None

    async def touch_validated(self, account_id: UUID) -> None:
        logger.debug("touch last_validated_at for account %s", account_id)
        await self.session.execute(
            update(VkProviderAccount)
            .where(VkProviderAccount.id == account_id)
            .values(last_validated_at=datetime.now(UTC))
        )
