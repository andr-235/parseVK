from app.db.models import Listing
from sqlalchemy import String, cast, delete, distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession


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
    ) -> tuple[list[Listing], int, list[str]]:
        stmt = select(Listing)
        stmt = self._filter(stmt, search=search, source=source, archived=archived)
        total = await self.session.scalar(select(func.count()).select_from(stmt.subquery()))
        order_by = self._order_by(sort_by, sort_order)
        rows = await self.session.scalars(
            stmt.order_by(*order_by).offset((page - 1) * page_size).limit(page_size)
        )
        source_rows = await self.session.scalars(
            select(distinct(Listing.source))
            .where(Listing.source.is_not(None), Listing.source != "")
            .order_by(Listing.source.asc())
        )
        return list(rows), int(total or 0), [item for item in source_rows if item]

    async def find_for_export(
        self,
        *,
        search: str | None,
        source: str | None,
        archived: bool | None,
    ) -> list[Listing]:
        stmt = self._filter(
            select(Listing),
            search=search,
            source=source,
            archived=archived,
        )
        rows = await self.session.scalars(
            stmt.order_by(
                Listing.source_author_name.asc().nulls_last(),
                Listing.contact_name.asc().nulls_last(),
                Listing.id.asc(),
            )
        )
        return list(rows)

    async def find_by_id(self, listing_id: int) -> Listing | None:
        return await self.session.scalar(select(Listing).where(Listing.id == listing_id))

    async def find_by_url(self, url: str) -> Listing | None:
        return await self.session.scalar(select(Listing).where(Listing.url == url))

    async def create_listing(self, data: dict) -> Listing:
        row = Listing(**data)
        self.session.add(row)
        await self.session.flush()
        return row

    async def update_listing(self, listing_id: int, data: dict) -> Listing | None:
        row = await self.find_by_id(listing_id)
        if row is None:
            return None
        for key, value in data.items():
            setattr(row, key, value)
        await self.session.flush()
        return row

    async def update_by_url(self, url: str, data: dict) -> Listing:
        row = await self.find_by_url(url)
        if row is None:
            return await self.create_listing(data)
        for key, value in data.items():
            setattr(row, key, value)
        await self.session.flush()
        return row

    async def delete_listing(self, listing_id: int) -> bool:
        result = await self.session.execute(delete(Listing).where(Listing.id == listing_id))
        return bool(result.rowcount)

    def _filter(self, stmt, *, search: str | None, source: str | None, archived: bool | None):
        if search:
            pattern = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Listing.title).like(pattern),
                    func.lower(Listing.description).like(pattern),
                    func.lower(Listing.address).like(pattern),
                    func.lower(Listing.city).like(pattern),
                    func.lower(Listing.external_id).like(pattern),
                    func.lower(Listing.contact_name).like(pattern),
                    func.lower(Listing.contact_phone).like(pattern),
                    cast(Listing.id, String).like(pattern),
                )
            )
        if source:
            stmt = stmt.where(func.lower(Listing.source) == source.lower())
        if archived is not None:
            stmt = stmt.where(Listing.archived == archived)
        return stmt

    def _order_by(self, sort_by: str | None, sort_order: str):
        fields = {
            "createdAt": Listing.created_at,
            "price": Listing.price,
            "publishedAt": Listing.published_at,
            "source": Listing.source,
            "address": Listing.address,
            "title": Listing.title,
            "sourceAuthorName": Listing.source_author_name,
            "contactPhone": Listing.contact_phone,
            "sourceAuthorUrl": Listing.source_author_url,
            "sourceParsedAt": Listing.source_parsed_at,
        }
        if not sort_by or sort_by not in fields:
            return (Listing.created_at.desc(),)
        column = fields[sort_by]
        primary = column.asc().nulls_last() if sort_order == "asc" else column.desc().nulls_last()
        return (primary, Listing.id.asc())
