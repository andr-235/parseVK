import asyncio
import logging
import random
from datetime import UTC, datetime
from urllib.parse import urlparse

from app.core.config import settings

logger = logging.getLogger("telegram-service.client")

# Attempt to import Telethon and its exception types
try:
    from telethon import TelegramClient, events
    from telethon.errors import ChatAdminRequiredError
    from telethon.sessions import StringSession
    TELETHON_AVAILABLE = True
except ImportError:
    TELETHON_AVAILABLE = False
    logger.warning("Telethon package is not available in the current environment. Fallback to simulation will be used.")

# Attempt to import python_socks
try:
    import python_socks
    SOCKS_AVAILABLE = True
except ImportError:
    SOCKS_AVAILABLE = False
    logger.warning("python-socks package is not available in the current environment. Proxy support for Telethon may be limited.")


def resolve_target(target: str) -> str | int:
    """
    Cleans up input target (e.g. stripping spaces, @ symbol, resolving t.me links)
    and attempts to convert numeric IDs to int.
    """
    target = target.strip()
    if not target:
        return target
        
    # Remove link wrappers
    if "t.me/" in target:
        target = target.split("t.me/")[-1]
    elif "telegram.me/" in target:
        target = target.split("telegram.me/")[-1]
        
    # Remove @ sign if present
    if target.startswith("@"):
        target = target[1:]
        
    # Check if target is a pure numeric ID (could be negative)
    # E.g. -100123456789 or 123456789
    if target.isdigit() or (target.startswith("-") and target[1:].isdigit()):
        return int(target)
        
    return target


def parse_proxy_url(proxy_url: str | None) -> dict | None:
    """
    Parses a proxy URL (e.g. socks5://user:pass@host:port) into a dictionary
    compatible with Telethon's proxy argument.
    """
    if not proxy_url:
        return None
    try:
        parsed = urlparse(proxy_url)
        scheme = parsed.scheme.lower()
        
        # Determine proxy type using python_socks if available
        if SOCKS_AVAILABLE:
            if "socks5" in scheme:
                proxy_type = python_socks.ProxyType.SOCKS5
            elif "socks4" in scheme:
                proxy_type = python_socks.ProxyType.SOCKS4
            elif "http" in scheme or "https" in scheme:
                proxy_type = python_socks.ProxyType.HTTP
            else:
                proxy_type = python_socks.ProxyType.SOCKS5
        else:
            # Fallback integer types if python_socks is not imported (PySocks compatibility)
            # SOCKS5 = 2, SOCKS4 = 1, HTTP = 3
            if "socks5" in scheme:
                proxy_type = 2
            elif "socks4" in scheme:
                proxy_type = 1
            elif "http" in scheme or "https" in scheme:
                proxy_type = 3
            else:
                proxy_type = 2

        return {
            'proxy_type': proxy_type,
            'addr': parsed.hostname,
            'port': parsed.port or (1080 if 'socks' in scheme else 80),
            'username': parsed.username,
            'password': parsed.password,
            'rdns': True
        }
    except Exception as exc:
        logger.error(f"Error parsing proxy URL '{proxy_url}': {exc}")
        return None


class TelegramApiClient:
    """
    Client utilizing Telethon (MTProto) for Telegram API interactions.
    Incorporates proxy support using the VPN_SERVICE_TELEGRAM_URL environment setting.
    Falls back to simulated data if Telegram credentials are not configured.
    """

    def __init__(self) -> None:
        self.proxy_url = settings.vpn_service_telegram_url
        self.api_id = settings.telegram_api_id
        self.api_hash = settings.telegram_api_hash
        self.bot_token = settings.telegram_bot_token
        self.session_string = settings.telegram_session_string
        
        self.client = None
        # Use mock simulation if credentials are not provided or Telethon is missing
        self.is_mock = not (TELETHON_AVAILABLE and self.api_id and self.api_hash)
        
        if self.is_mock:
            logger.info("TelegramApiClient initialized in SIMULATION (mock) mode.")
        else:
            logger.info(f"TelegramApiClient: initializing real Telethon client (Proxy: {self.proxy_url})")
            proxy = parse_proxy_url(self.proxy_url)
            
            if self.session_string:
                session = StringSession(self.session_string)
            else:
                session = "telegram_service_session"
                
            self.client = TelegramClient(
                session,
                self.api_id,
                self.api_hash,
                proxy=proxy
            )

    async def ensure_connected(self) -> None:
        """
        Helper method to ensure the Telethon client is connected and authorized.
        """
        if self.is_mock:
            return
            
        if not self.client:
            raise RuntimeError("TelegramClient was not initialized")
            
        if not self.client.is_connected():
            logger.info("Connecting Telethon client to Telegram network...")
            if self.bot_token:
                await self.client.start(bot_token=self.bot_token)
            else:
                await self.client.start()
        elif not await self.client.is_user_authorized():
            logger.info("Telethon client connected but not authorized. Authorizing...")
            if self.bot_token:
                await self.client.start(bot_token=self.bot_token)
            else:
                await self.client.start()

    async def close(self) -> None:
        """
        Gracefully disconnects the client.
        """
        if self.client and self.client.is_connected():
            logger.info("Disconnecting Telethon client...")
            await self.client.disconnect()

    async def get_user_dialogs(self) -> list[dict]:
        """
        Retrieves the list of all dialogs (groups, channels, chats) for the logged-in user.
        """
        if self.is_mock:
            # Simulated list of dialogs for simulation fallback
            return [
                {"id": -100188888888, "title": "Чат команды разработки", "username": "@dev_chat", "type": "supergroup"},
                {"id": -100199999999, "title": "Новостной канал IT", "username": "@it_news", "type": "channel"},
                {"id": -100177777777, "title": "Обсуждение проектов", "username": "@project_discuss", "type": "supergroup"},
                {"id": -100166666666, "title": "Криминальная хроника (Регион)", "username": "—", "type": "channel"},
                {"id": -100155555555, "title": "Городская флудилка", "username": "@city_chat", "type": "supergroup"},
            ]

        await self.ensure_connected()
        dialogs = []
        try:
            from telethon.tl.types import Channel, Chat, User
            # iter_dialogs yields Dialog instances
            async for dialog in self.client.iter_dialogs():
                entity = dialog.entity
                
                # We are interested in groups, supergroups, and channels (not individual users)
                if isinstance(entity, User):
                    continue
                    
                chat_type = "unknown"
                username = getattr(entity, 'username', None) or ""
                
                if isinstance(entity, Channel):
                    chat_type = "supergroup" if entity.megagroup else "channel"
                elif isinstance(entity, Chat):
                    chat_type = "group"
                    
                dialogs.append({
                    "id": entity.id,
                    "title": dialog.name,
                    "username": f"@{username}" if username else "—",
                    "type": chat_type
                })
        except Exception as exc:
            logger.error(f"Failed to fetch user dialogs: {exc}")
            raise RuntimeError(f"Не удалось получить список чатов: {exc}")
            
        return dialogs

    async def get_chat_info(self, target: str) -> dict:
        """
        Retrieves channel/group metadata.
        """
        if self.is_mock:
            clean_target = str(resolve_target(target))
            return {
                "id": random.randint(10000000, 99999999),
                "title": f"Telegram Chat: {clean_target}",
                "username": clean_target,
                "type": "channel" if "channel" in clean_target.lower() else "supergroup",
            }
            
        await self.ensure_connected()
        
        resolved_target = resolve_target(target)
        try:
            entity = await self.client.get_entity(resolved_target)
        except Exception as exc:
            logger.error(f"Failed to get Telegram entity for '{resolved_target}' (original: '{target}'): {exc}")
            raise RuntimeError(f"Не удалось найти чат/канал/пользователя '{target}': {exc}")
            
        from telethon.tl.types import Channel, Chat, User
        
        entity_id = entity.id
        username = getattr(entity, 'username', None) or ""
        
        if isinstance(entity, Channel):
            title = entity.title
            chat_type = "supergroup" if entity.megagroup else "channel"
        elif isinstance(entity, Chat):
            title = entity.title
            chat_type = "group"
        elif isinstance(entity, User):
            first_name = entity.first_name or ""
            last_name = entity.last_name or ""
            title = f"{first_name} {last_name}".strip() or f"User {entity_id}"
            chat_type = "user"
        else:
            title = getattr(entity, 'title', "Unknown")
            chat_type = "unknown"
            
        return {
            "id": entity_id,
            "title": title,
            "username": f"@{username}" if username else "—",
            "type": chat_type
        }

    async def fetch_members(self, target: str, limit: int = 100, offset: int = 0) -> list[dict]:
        """
        Retrieves a list of participants from a target channel or group.
        Supports paging via the offset parameter.
        """
        if self.is_mock:
            await asyncio.sleep(0.1)  # Simulate network latency
            clean_target = str(resolve_target(target))
            
            first_names = ["Александр", "Дмитрий", "Сергей", "Андрей", "Алексей", "Елена", "Ольга", "Татьяна", "Ирина", "Мария", "Павел", "Максим", "Артем", "Анна", "Наталья"]
            last_names = ["Иванов", "Петров", "Сидоров", "Смирнов", "Кузнецов", "Попов", "Васильев", "Соколов", "Михайлов", "Новиков", "Федоров", "Морозов", "Волков", "Соловьев", "Лебедев"]
            roles = ["Member", "Member", "Member", "Member", "Member", "Administrator", "Member"]
            
            members = []
            for i in range(limit):
                user_id = 300000000 + offset + i
                username = f"{clean_target}_member_{offset + i}" if random.random() > 0.2 else None
                first_name = random.choice(first_names)
                last_name = random.choice(last_names) if random.random() > 0.3 else None
                phone = f"+79{random.randint(100000000, 999999999)}" if random.random() > 0.85 else "Скрыт"
                is_bot = "Да" if random.random() > 0.97 else "Нет"
                role = "Creator" if (offset + i) == 0 else (random.choice(["Administrator", "Member"]) if (offset + i) < 3 else random.choice(roles))
                join_date = datetime.now(UTC).isoformat()
                
                members.append({
                    "userId": user_id,
                    "username": f"@{username}" if username else "—",
                    "firstName": first_name,
                    "lastName": last_name or "—",
                    "phone": phone,
                    "isBot": is_bot,
                    "role": role,
                    "joinDate": join_date,
                })
            return members

        await self.ensure_connected()
        
        resolved_target = resolve_target(target)
        try:
            entity = await self.client.get_entity(resolved_target)
        except Exception as exc:
            logger.error(f"Failed to resolve target '{resolved_target}' (original: '{target}') for members: {exc}")
            raise RuntimeError(f"Не удалось найти чат/канал '{target}': {exc}")
            
        from telethon.tl.types import Channel, Chat
        
        # Fetch admins list to mark roles appropriately
        admins = {}
        if isinstance(entity, (Channel, Chat)):
            try:
                from telethon.tl.types import ChannelParticipantCreator, ChannelParticipantsAdmins
                async for user in self.client.iter_participants(entity, filter=ChannelParticipantsAdmins):
                    role = "Administrator"
                    if hasattr(user, 'participant') and isinstance(user.participant, ChannelParticipantCreator):
                        role = "Creator"
                    admins[user.id] = role
            except Exception as exc:
                logger.warning(f"Could not fetch admins list for role resolution: {exc}")
                
        members = []
        try:
            # iter_participants handles pagination under the hood via limit and offset
            async for user in self.client.iter_participants(entity, limit=limit, offset=offset):
                user_id = user.id
                username = f"@{user.username}" if user.username else "—"
                first_name = user.first_name or "—"
                last_name = user.last_name or "—"
                phone = f"+{user.phone}" if user.phone else "Скрыт"
                is_bot = "Да" if user.bot else "Нет"
                
                role = admins.get(user_id, "Member")
                
                join_date = None
                if hasattr(user, 'participant') and getattr(user.participant, 'date', None):
                    join_date = user.participant.date.isoformat()
                else:
                    join_date = datetime.now(UTC).isoformat()
                    
                members.append({
                    "userId": user_id,
                    "username": username,
                    "firstName": first_name,
                    "lastName": last_name,
                    "phone": phone,
                    "isBot": is_bot,
                    "role": role,
                    "joinDate": join_date,
                })
        except Exception as exc:
            logger.exception(f"Error iterating participants for target '{resolved_target}': {exc}")
            # Handle specific hidden members list exception
            if TELETHON_AVAILABLE:
                if isinstance(exc, ChatAdminRequiredError) or exc.__class__.__name__ == 'ChatAdminRequiredError':
                    raise RuntimeError("Список участников скрыт администраторами группы. Требуются права администратора.")
            raise RuntimeError(f"Не удалось выгрузить список участников: {exc}")
            
        return members
