from sqlalchemy import String, cast, delete, distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentListing


class ListingsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_listings(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        source: str | None,
        archived: bool | None,
        sort_by: str | None,
        sort_order: str,
    ) -> tuple[list[ContentListing], int, list[str]]:
        stmt = select(ContentListing)
        stmt = self._filter(stmt, search=search, source=source, archived=archived)
        total = await self.session.scalar(select(func.count()).select_from(stmt.subquery()))
        order_by = self._order_by(sort_by, sort_order)
        rows = await self.session.scalars(
            stmt.order_by(*order_by).offset((page - 1) * page_size).limit(page_size)
        )
        source_rows = await self.session.scalars(
            select(distinct(ContentListing.source))
            .where(ContentListing.source.is_not(None), ContentListing.source != "")
            .order_by(ContentListing.source.asc())
        )
        return list(rows), int(total or 0), [item for item in source_rows if item]

    async def find_for_export(
        self,
        *,
        search: str | None,
        source: str | None,
        archived: bool | None,
    ) -> list[ContentListing]:
        stmt = self._filter(
            select(ContentListing),
            search=search,
            source=source,
            archived=archived,
        )
        rows = await self.session.scalars(
            stmt.order_by(
                ContentListing.source_author_name.asc().nulls_last(),
                ContentListing.contact_name.asc().nulls_last(),
                ContentListing.id.asc(),
            )
        )
        return list(rows)

    async def find_by_id(self, listing_id: int) -> ContentListing | None:
        return await self.session.scalar(select(ContentListing).where(ContentListing.id == listing_id))

    async def find_by_url(self, url: str) -> ContentListing | None:
        return await self.session.scalar(select(ContentListing).where(ContentListing.url == url))

    async def create_listing(self, data: dict) -> ContentListing:
        row = ContentListing(**data)
        self.session.add(row)
        await self.session.flush()
        return row

    async def update_listing(self, listing_id: int, data: dict) -> ContentListing | None:
        row = await self.find_by_id(listing_id)
        if row is None:
            return None
        for key, value in data.items():
            setattr(row, key, value)
        await self.session.flush()
        return row

    async def update_by_url(self, url: str, data: dict) -> ContentListing:
        row = await self.find_by_url(url)
        if row is None:
            return await self.create_listing(data)
        for key, value in data.items():
            setattr(row, key, value)
        await self.session.flush()
        return row

    async def delete_listing(self, listing_id: int) -> bool:
        result = await self.session.execute(delete(ContentListing).where(ContentListing.id == listing_id))
        return bool(result.rowcount)

    def _filter(self, stmt, *, search: str | None, source: str | None, archived: bool | None):
        if search:
            pattern = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(ContentListing.title).like(pattern),
                    func.lower(ContentListing.description).like(pattern),
                    func.lower(ContentListing.address).like(pattern),
                    func.lower(ContentListing.city).like(pattern),
                    func.lower(ContentListing.external_id).like(pattern),
                    func.lower(ContentListing.contact_name).like(pattern),
                    func.lower(ContentListing.contact_phone).like(pattern),
                    cast(ContentListing.id, String).like(pattern),
                )
            )
        if source:
            stmt = stmt.where(func.lower(ContentListing.source) == source.lower())
        if archived is not None:
            stmt = stmt.where(ContentListing.archived == archived)
        return stmt

    def _order_by(self, sort_by: str | None, sort_order: str):
        fields = {
            "createdAt": ContentListing.created_at,
            "price": ContentListing.price,
            "publishedAt": ContentListing.published_at,
            "source": ContentListing.source,
            "address": ContentListing.address,
            "title": ContentListing.title,
            "sourceAuthorName": ContentListing.source_author_name,
            "contactPhone": ContentListing.contact_phone,
            "sourceAuthorUrl": ContentListing.source_author_url,
            "sourceParsedAt": ContentListing.source_parsed_at,
        }
        if not sort_by or sort_by not in fields:
            return (ContentListing.created_at.desc(),)
        column = fields[sort_by]
        primary = column.asc().nulls_last() if sort_order == "asc" else column.desc().nulls_last()
        return (primary, ContentListing.id.asc())
