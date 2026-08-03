import logging
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    ACCOUNT_STATUS_INVALID,
    SYSTEM_VK_CAPABILITY,
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
        model = await self.session.scalar(
            select(VkProviderAccount).where(
                VkProviderAccount.account_key == account_key
            )
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
        effective_capabilities = (
            [SYSTEM_VK_CAPABILITY] if capabilities is None else capabilities
        )
        model = await self.session.scalar(
            select(VkProviderAccount)
            .where(VkProviderAccount.account_key == account_key)
            .with_for_update()
        )
        if model is None:
            model = VkProviderAccount(
                account_key=account_key,
                provider=provider,
                status=ACCOUNT_STATUS_ACTIVE,
                credential_version=credential_version,
                capabilities=effective_capabilities,
            )
            self.session.add(model)
        else:
            model.provider = provider
            model.status = ACCOUNT_STATUS_ACTIVE
            model.credential_version = credential_version
            model.capabilities = effective_capabilities
            model.cooldown_until = None
            model.last_error_code = None
            model.last_error_kind = None
            model.revision += 1
        await self.session.flush()
        return _to_entity(model)

    async def transition_to_invalid(
        self,
        account_id: UUID,
        credential_version: str,
        *,
        error_code: int | None = None,
        error_kind: str | None = None,
    ) -> bool:
        result = await self.session.execute(
            update(VkProviderAccount)
            .where(
                VkProviderAccount.id == account_id,
                VkProviderAccount.credential_version == credential_version,
                VkProviderAccount.status != ACCOUNT_STATUS_INVALID,
            )
            .values(
                status=ACCOUNT_STATUS_INVALID,
                cooldown_until=None,
                last_error_code=error_code,
                last_error_kind=error_kind,
                revision=VkProviderAccount.revision + 1,
            )
            .returning(VkProviderAccount.id)
        )
        return result.scalar_one_or_none() is not None

    async def set_cooldown(self, account_id: UUID, until: datetime) -> None:
        await self.session.execute(
            update(VkProviderAccount)
            .where(VkProviderAccount.id == account_id)
            .values(
                status="cooling_down",
                cooldown_until=until,
                revision=VkProviderAccount.revision + 1,
            )
        )

    async def mark_active(
        self,
        account_id: UUID,
        credential_version: str,
        capabilities: list[str],
    ) -> ProviderAccount | None:
        result = await self.session.execute(
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
        model = result.scalar_one_or_none()
        return _to_entity(model) if model is not None else None

    async def touch_validated(self, account_id: UUID) -> None:
        await self.session.execute(
            update(VkProviderAccount)
            .where(VkProviderAccount.id == account_id)
            .values(last_validated_at=datetime.now(UTC))
        )
