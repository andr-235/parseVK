import asyncio
import logging
import re

from app.modules.telegram_tgmbase.mapper import TelegramTgmbaseMapper
from app.modules.telegram_tgmbase.models import Channel, Group, Message, Supergroup, User
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("content-service.telegram-tgmbase.search")


def normalize_phone_number(value: str) -> str:
    return re.sub(r'[^\d+]', '', value)


def normalize_tgmbase_query(raw_value: str) -> dict:
    trimmed = raw_value.strip()
    if not trimmed:
        return {
            "rawValue": raw_value,
            "normalizedValue": "",
            "queryType": "invalid",
        }

    if trimmed.isdigit():
        return {
            "rawValue": raw_value,
            "normalizedValue": trimmed,
            "queryType": "telegramId",
        }

    phone_candidate = normalize_phone_number(trimmed)
    if re.match(r'^\+?\d{10,15}$', phone_candidate):
        return {
            "rawValue": raw_value,
            "normalizedValue": phone_candidate,
            "queryType": "phoneNumber",
        }

    if re.match(r'^@?[a-zA-Z0-9_]{3,32}$', trimmed):
        normalized = re.sub(r'^@', '', trimmed).lower()
        return {
            "rawValue": raw_value,
            "normalizedValue": normalized,
            "queryType": "username",
        }

    return {
        "rawValue": raw_value,
        "normalizedValue": trimmed,
        "queryType": "invalid",
    }


class TelegramTgmbaseSearchService:
    def __init__(self, session: AsyncSession, mapper: TelegramTgmbaseMapper):
        self.session = session
        self.mapper = mapper

    async def search(self, payload: dict) -> dict:
        queries = payload.get("queries", [])
        page = payload.get("page", 1) or 1
        page_size = payload.get("pageSize", 20) or 20

        items = []
        for raw_query in queries:
            item = await self._search_single(raw_query, page, page_size)
            items.append(item)

        summary = self._build_search_summary(items)
        return {
            "summary": summary,
            "items": items
        }

    async def _search_single(self, raw_query: str, page: int, page_size: int) -> dict:
        normalized = normalize_tgmbase_query(raw_query)
        if normalized["queryType"] == "invalid":
            return self._create_base_search_item(normalized, "invalid", page, page_size)

        try:
            matches = await self._find_matching_users(normalized)

            if not matches:
                return self._create_base_search_item(normalized, "not_found", page, page_size)

            if len(matches) > 1:
                item = self._create_base_search_item(normalized, "ambiguous", page, page_size)
                item["candidates"] = [self.mapper.map_candidate(u) for u in matches[:10]]
                return item

            profile = matches[0]
            peers = await self._find_peers_for_user(profile.user_id)

            # РЎС‚СЂРѕРёРј РјР°РїСѓ РґР»СЏ peers
            peer_map = {peer["peerId"]: peer for peer in peers}

            contacts, messages_page = await asyncio.gather(
                self._find_contacts(profile.user_id, peers),
                self._find_messages(profile.user_id, page, page_size, peer_map)
            )

            return {
                "query": raw_query,
                "normalizedQuery": normalized["normalizedValue"],
                "queryType": normalized["queryType"],
                "status": "found",
                "profile": self.mapper.map_profile(profile),
                "candidates": [],
                "groups": peers,
                "contacts": contacts,
                "messagesPage": messages_page,
                "stats": {
                    "groups": len(peers),
                    "contacts": len(contacts),
                    "messages": messages_page["total"],
                },
                "error": None
            }
        except Exception as exc:
            logger.exception(f"tgmbase search failed for {raw_query}")
            item = self._create_base_search_item(normalized, "error", page, page_size)
            item["error"] = str(exc)
            return item

    async def _find_matching_users(self, normalized: dict) -> list:
        q_type = normalized["queryType"]
        val = normalized["normalizedValue"]

        stmt = select(User)
        if q_type == "telegramId":
            stmt = stmt.where(User.user_id == int(val))
        elif q_type == "username":
            stmt = stmt.where(func.lower(User.username) == val.lower())
        elif q_type == "phoneNumber":
            variants = self._build_phone_variants(val)
            stmt = stmt.where(User.phone.in_(variants))
        else:
            return []

        stmt = stmt.order_by(User.upd_date.desc()).limit(10)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    def _build_phone_variants(self, value: str) -> list[str]:
        digits_only = re.sub(r'[^\d+]', '', value).replace("+", "")
        variants = {value, digits_only, f"+{digits_only}"}

        if digits_only.startswith("8") and len(digits_only) == 11:
            variants.add(f"+7{digits_only[1:]}")
        if digits_only.startswith("7") and len(digits_only) == 11:
            variants.add(f"8{digits_only[1:]}")

        return list(variants)

    async def _find_peers_for_user(self, user_id: int) -> list[dict]:
        stmt = select(Message.peer_id, func.count(Message.id)).where(
            Message.from_id == user_id
        ).group_by(Message.peer_id).order_by(func.count(Message.id).desc()).limit(50)

        res = await self.session.execute(stmt)
        rows = res.all()
        if not rows:
            return []

        peer_ids = [r[0] for r in rows]

        g_stmt = select(Group).where(Group.group_id.in_(peer_ids))
        sg_stmt = select(Supergroup).where(Supergroup.supergroup_id.in_(peer_ids))
        ch_stmt = select(Channel).where(Channel.channel_id.in_(peer_ids))

        g_res, sg_res, ch_res = await asyncio.gather(
            self.session.execute(g_stmt),
            self.session.execute(sg_stmt),
            self.session.execute(ch_stmt)
        )

        groups = {g.group_id: g for g in g_res.scalars().all()}
        supergroups = {sg.supergroup_id: sg for sg in sg_res.scalars().all()}
        channels = {ch.channel_id: ch for ch in ch_res.scalars().all()}

        peers = []
        for peer_id in peer_ids:
            p_id_str = str(peer_id)
            if peer_id in supergroups:
                sg = supergroups[peer_id]
                peers.append({
                    "peerId": p_id_str,
                    "title": sg.title or p_id_str,
                    "username": sg.username,
                    "type": "supergroup",
                    "participantsCount": sg.participants_count,
                    "region": None
                })
            elif peer_id in channels:
                ch = channels[peer_id]
                peers.append({
                    "peerId": p_id_str,
                    "title": ch.title or p_id_str,
                    "username": ch.username,
                    "type": "channel",
                    "participantsCount": ch.participants_count,
                    "region": None
                })
            elif peer_id in groups:
                g = groups[peer_id]
                peers.append({
                    "peerId": p_id_str,
                    "title": g.title or p_id_str,
                    "username": None,
                    "type": "group",
                    "participantsCount": g.participants_count,
                    "region": g.region
                })
            else:
                peers.append({
                    "peerId": p_id_str,
                    "title": p_id_str,
                    "username": None,
                    "type": "unknown",
                    "participantsCount": None,
                    "region": None
                })

        return peers

    async def _find_contacts(self, user_id: int, peers: list[dict]) -> list[dict]:
        peer_ids = [int(p["peerId"]) for p in peers]
        if not peer_ids:
            return []

        common_peers_count = func.count(func.distinct(Message.peer_id)).label(
            "common_peers_count"
        )
        message_count = func.count(Message.id).label("message_count")
        stmt = (
            select(Message.from_id, common_peers_count, message_count)
            .where(
                Message.peer_id.in_(peer_ids),
                Message.from_id.is_not(None),
                Message.from_id != user_id,
            )
            .group_by(Message.from_id)
            .order_by(common_peers_count.desc(), message_count.desc())
            .limit(20)
        )
        res = await self.session.execute(
            stmt,
        )
        rows = res.all()
        if not rows:
            return []

        contact_user_ids = [r[0] for r in rows]

        u_stmt = select(User).where(User.user_id.in_(contact_user_ids))
        u_res = await self.session.execute(u_stmt)
        users = {u.user_id: u for u in u_res.scalars().all()}

        contacts = []
        for row in rows:
            c_uid = row[0]
            common_peers = int(row[1])
            msg_count = int(row[2])

            user_obj = users.get(c_uid)
            if user_obj:
                profile = self.mapper.map_profile(user_obj)
                contacts.append({
                    "telegramId": str(c_uid),
                    "username": profile["username"],
                    "phoneNumber": profile["phoneNumber"],
                    "fullName": profile["fullName"],
                    "commonPeersCount": common_peers,
                    "messageCount": msg_count
                })
            else:
                contacts.append({
                    "telegramId": str(c_uid),
                    "username": None,
                    "phoneNumber": None,
                    "fullName": str(c_uid),
                    "commonPeersCount": common_peers,
                    "messageCount": msg_count
                })

        return contacts

    async def _find_messages(self, user_id: int, page: int, page_size: int, peer_map: dict) -> dict:
        skip = (page - 1) * page_size

        count_stmt = select(func.count(Message.id)).where(Message.from_id == user_id)
        count_res = await self.session.execute(count_stmt)
        total = count_res.scalar() or 0

        msg_stmt = (
            select(Message)
            .where(Message.from_id == user_id)
            .order_by(Message.date.desc())
            .offset(skip)
            .limit(page_size)
        )
        msg_res = await self.session.execute(msg_stmt)
        messages = msg_res.scalars().all()

        items = []
        for m in messages:
            peer = peer_map.get(str(m.peer_id))
            items.append({
                "id": str(m.id),
                "messageId": str(m.message_id),
                "peerId": str(m.peer_id),
                "peerTitle": peer["title"] if peer else None,
                "peerType": peer["type"] if peer else "unknown",
                "date": m.date.isoformat() if m.date else None,
                "text": m.message,
                "fromId": str(m.from_id) if m.from_id else None,
                "replyTo": str(m.reply_to) if m.reply_to else None,
                "hasMedia": bool(m.media),
                "hasKeywords": bool(m.keywords)
            })

        return {
            "items": items,
            "page": page,
            "pageSize": page_size,
            "total": total,
            "hasMore": skip + len(items) < total
        }

    def _create_base_search_item(
        self,
        normalized: dict,
        status: str,
        page: int,
        page_size: int,
    ) -> dict:
        return {
            "query": normalized["rawValue"],
            "normalizedQuery": normalized["normalizedValue"],
            "queryType": normalized["queryType"],
            "status": status,
            "profile": None,
            "candidates": [],
            "groups": [],
            "contacts": [],
            "messagesPage": {
                "items": [],
                "page": page,
                "pageSize": page_size,
                "total": 0,
                "hasMore": False
            },
            "stats": {
                "groups": 0,
                "contacts": 0,
                "messages": 0
            },
            "error": None
        }

    def _build_search_summary(self, items: list) -> dict:
        return {
            "total": len(items),
            "found": sum(1 for item in items if item["status"] == "found"),
            "notFound": sum(1 for item in items if item["status"] == "not_found"),
            "ambiguous": sum(1 for item in items if item["status"] == "ambiguous"),
            "invalid": sum(1 for item in items if item["status"] == "invalid"),
            "error": sum(1 for item in items if item["status"] == "error")
        }