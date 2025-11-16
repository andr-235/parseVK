import { BadRequestException, Injectable, InternalServerErrorException, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import bigInt, { type BigInteger } from 'big-integer';
import { TelegramChatType, TelegramMemberStatus } from '@prisma/client';
import type { TelegramSyncResultDto } from './dto/telegram-sync-result.dto';
import type { TelegramMemberDto } from './dto/telegram-member.dto';
import { PrismaService } from '../prisma.service';
import ExcelJS from 'exceljs';

interface SyncChatParams {
  identifier: string;
  limit?: number;
}

interface ResolvedChat {
  telegramId: bigint;
  type: TelegramChatType;
  title: string | null;
  username: string | null;
  description: string | null;
  entity: Api.Channel | Api.Chat | Api.User;
  totalMembers: number | null;
}

interface MemberRecord {
  user: Api.User;
  status: TelegramMemberStatus;
  isAdmin: boolean;
  isOwner: boolean;
  joinedAt: Date | null;
  leftAt: Date | null;
}

interface ParticipantCollection {
  members: MemberRecord[];
  total: number | null;
}

@Injectable()
export class TelegramService implements OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private client: TelegramClient | null = null;
  private initializing: Promise<void> | null = null;
  private readonly defaultLimit = 1000;
  private currentSessionId: number | null = null;
  private unhandledRejectionHandler: ((reason: unknown) => void) | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.unhandledRejectionHandler = (reason: unknown) => {
      if (
        reason instanceof Error &&
        reason.message.includes('TIMEOUT') &&
        reason.stack?.includes('telegram/client/updates.js')
      ) {
        // Подавляем ошибки TIMEOUT из update loop
        return;
      }
      // Для других ошибок используем стандартную обработку
    };

    process.on('unhandledRejection', this.unhandledRejectionHandler);
  }

  onModuleDestroy(): void {
    if (this.unhandledRejectionHandler) {
      process.off('unhandledRejection', this.unhandledRejectionHandler);
    }
    if (this.client) {
      void this.client.disconnect();
    }
  }

  async syncChat(params: SyncChatParams): Promise<TelegramSyncResultDto> {
    const identifier = params.identifier?.trim();
    if (!identifier) {
      throw new BadRequestException('Identifier is required');
    }

    const client = await this.getClient();

    let entity: unknown;
    try {
      entity = await client.getEntity(identifier);
    } catch (error) {
      this.logger.error(`Failed to resolve Telegram entity for "${identifier}"`, error as Error);
      throw new BadRequestException('Unable to resolve Telegram chat by provided identifier');
    }

    const resolved = this.resolveChat(entity);
    if (!resolved) {
      throw new BadRequestException('Resolved Telegram entity is not a supported chat type');
    }

    const limit = params.limit ?? this.defaultLimit;

    let collection: ParticipantCollection;
    try {
      collection = await this.collectParticipants(client, resolved, limit);
    } catch (error) {
      this.logger.error(`Failed to collect participants for "${identifier}"`, error as Error);
      throw new InternalServerErrorException('Unable to fetch Telegram chat participants');
    }

    const persisted = await this.persistChat(resolved, collection.members);

    return {
      chatId: persisted.chatId,
      telegramId: persisted.telegramId.toString(),
      type: resolved.type,
      title: resolved.title,
      username: resolved.username,
      syncedMembers: collection.members.length,
      totalMembers: collection.total,
      fetchedMembers: collection.members.length,
      members: persisted.members,
    };
  }

  async exportChatToExcel(chatId: number): Promise<Buffer> {
    const chat = await this.prisma.telegramChat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!chat) {
      throw new BadRequestException('Chat not found');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Участники');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Telegram ID', key: 'telegramId', width: 15 },
      { header: 'Имя', key: 'firstName', width: 20 },
      { header: 'Фамилия', key: 'lastName', width: 20 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Телефон', key: 'phoneNumber', width: 15 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Админ', key: 'isAdmin', width: 10 },
      { header: 'Владелец', key: 'isOwner', width: 10 },
      { header: 'Присоединился', key: 'joinedAt', width: 20 },
      { header: 'Покинул', key: 'leftAt', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    for (const member of chat.members) {
      worksheet.addRow({
        id: member.user.id,
        telegramId: member.user.telegramId.toString(),
        firstName: member.user.firstName ?? '',
        lastName: member.user.lastName ?? '',
        username: member.user.username ? `@${member.user.username}` : '',
        phoneNumber: member.user.phoneNumber ?? '',
        status: this.formatMemberStatus(member.status),
        isAdmin: member.isAdmin ? 'Да' : 'Нет',
        isOwner: member.isOwner ? 'Да' : 'Нет',
        joinedAt: member.joinedAt ? member.joinedAt.toLocaleString('ru-RU') : '',
        leftAt: member.leftAt ? member.leftAt.toLocaleString('ru-RU') : '',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async getChatInfo(chatId: number) {
    const chat = await this.prisma.telegramChat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new BadRequestException('Chat not found');
    }

    return chat;
  }

  private formatMemberStatus(status: TelegramMemberStatus): string {
    const statusMap: Record<TelegramMemberStatus, string> = {
      CREATOR: 'Создатель',
      ADMINISTRATOR: 'Администратор',
      MEMBER: 'Участник',
      RESTRICTED: 'Ограничен',
      LEFT: 'Покинул',
      KICKED: 'Исключен',
    };
    return statusMap[status] ?? status;
  }

  private async getClient(): Promise<TelegramClient> {
    const sessionRecord = await this.prisma.telegramSession.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (this.client && this.currentSessionId === sessionRecord?.id) {
      return this.client;
    }

    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.currentSessionId = null;
    }

    if (!this.initializing) {
      this.initializing = this.initializeClient();
    }

    await this.initializing;
    if (!this.client) {
      throw new InternalServerErrorException('Telegram client initialization failed');
    }
    return this.client;
  }

  private async initializeClient(): Promise<void> {
    const settingsRecord = await this.prisma.telegramSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const apiIdRaw = settingsRecord?.apiId ?? this.configService.get<string | number>('TELEGRAM_API_ID');
    const apiHash = settingsRecord?.apiHash ?? this.configService.get<string>('TELEGRAM_API_HASH');

    const apiId = typeof apiIdRaw === 'string' ? Number.parseInt(apiIdRaw, 10) : apiIdRaw;
    if (!apiId || Number.isNaN(apiId)) {
      throw new InternalServerErrorException('TELEGRAM_API_ID is not configured. Please set it in Settings.');
    }

    if (!apiHash) {
      throw new InternalServerErrorException('TELEGRAM_API_HASH is not configured. Please set it in Settings.');
    }

    const sessionRecord = await this.prisma.telegramSession.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const sessionString = sessionRecord?.session ?? this.configService.get<string>('TELEGRAM_SESSION');

    if (!sessionString) {
      throw new InternalServerErrorException('TELEGRAM_SESSION is not configured. Please create a session first.');
    }

    try {
      const session = new StringSession(sessionString);
      const client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 5,
        noUpdates: true,
        receiveUpdates: false,
      });
      
      await client.connect();
      
      // Явно отключаем update loop
      if ('setNoUpdates' in client && typeof (client as { setNoUpdates?: (value: boolean) => void }).setNoUpdates === 'function') {
        (client as { setNoUpdates: (value: boolean) => void }).setNoUpdates(true);
      }
      
      // Подавляем ошибки update loop
      const originalEmit = client.emit.bind(client);
      client.emit = function (event: string, ...args: unknown[]) {
        if (event === 'error' && args[0] instanceof Error && args[0].message.includes('TIMEOUT')) {
          return false;
        }
        return originalEmit(event, ...args);
      };
      
      this.client = client;
      this.currentSessionId = sessionRecord?.id ?? null;
      this.logger.log('Telegram client initialized');
    } catch (error) {
      this.logger.error('Telegram client initialization error', error as Error);
      throw new InternalServerErrorException('Failed to initialize Telegram client');
    } finally {
      this.initializing = null;
    }
  }

  private resolveChat(entity: unknown): ResolvedChat | null {
    if (entity instanceof Api.Channel) {
      const type = entity.megagroup ? TelegramChatType.SUPERGROUP : TelegramChatType.CHANNEL;
      return {
        telegramId: this.toBigInt(entity.id),
        type,
        title: entity.title ?? null,
        username: entity.username ?? null,
        description: null,
        entity,
        totalMembers: typeof entity.participantsCount === 'number' ? entity.participantsCount : null,
      };
    }

    if (entity instanceof Api.Chat) {
      return {
        telegramId: this.toBigInt(entity.id),
        type: TelegramChatType.GROUP,
        title: entity.title ?? null,
        username: null,
        description: null,
        entity,
        totalMembers: typeof entity.participantsCount === 'number' ? entity.participantsCount : null,
      };
    }

    if (entity instanceof Api.User) {
      return {
        telegramId: this.toBigInt(entity.id),
        type: TelegramChatType.PRIVATE,
        title: this.composeUserTitle(entity),
        username: entity.username ?? null,
        description: null,
        entity,
        totalMembers: 1,
      };
    }

    return null;
  }

  private async collectParticipants(
    client: TelegramClient,
    resolved: ResolvedChat,
    limit: number,
  ): Promise<ParticipantCollection> {
    if (resolved.type === TelegramChatType.CHANNEL || resolved.type === TelegramChatType.SUPERGROUP) {
      return this.collectChannelParticipants(client, resolved.entity as Api.Channel, limit);
    }

    if (resolved.type === TelegramChatType.GROUP) {
      return this.collectChatParticipants(client, resolved.entity as Api.Chat, limit);
    }

    return this.collectPrivateParticipant(resolved.entity as Api.User);
  }

  private async collectChannelParticipants(
    client: TelegramClient,
    channel: Api.Channel,
    limit: number,
  ): Promise<ParticipantCollection> {
    const members: MemberRecord[] = [];
    let offset = 0;
    const maxToFetch = Math.max(1, Math.min(limit, 10000));
    const totalMembers = typeof channel.participantsCount === 'number' ? channel.participantsCount : null;

    while (members.length < maxToFetch) {
      const batchLimit = Math.min(200, maxToFetch - members.length);
      const response = await client.invoke(
        new Api.channels.GetParticipants({
          channel: new Api.InputChannel({
            channelId: this.toTelegramLong(channel.id),
            accessHash: this.toTelegramLong(channel.accessHash ?? 0),
          }),
          filter: new Api.ChannelParticipantsRecent(),
          offset,
          limit: batchLimit,
          hash: bigInt.zero,
        }),
      );

      if (!('participants' in response)) {
        break;
      }

      const usersMap = this.buildUsersMap(response.users);

      for (const participant of response.participants) {
        const userKey = this.extractChannelParticipantUserKey(participant);
        if (!userKey) {
          continue;
        }
        const user = usersMap.get(userKey);
        if (!user) {
          continue;
        }
        members.push(this.buildMemberRecordFromChannel(user, participant));
        if (members.length >= maxToFetch) {
          break;
        }
      }

      if (response.participants.length < batchLimit) {
        break;
      }

      offset += response.participants.length;
    }

    return { members, total: totalMembers };
  }

  private async collectChatParticipants(
    client: TelegramClient,
    chat: Api.Chat,
    limit: number,
  ): Promise<ParticipantCollection> {
    const response = await client.invoke(
      new Api.messages.GetFullChat({
        chatId: chat.id,
      }),
    );

    if (!(response.fullChat instanceof Api.ChatFull)) {
      return { members: [], total: null };
    }

    const participantsContainer = response.fullChat.participants;
    const usersMap = this.buildUsersMap(response.users);
    const members: MemberRecord[] = [];
    let total: number | null = null;

    if (participantsContainer instanceof Api.ChatParticipants) {
      const entries = participantsContainer.participants ?? [];
      total = participantsContainer.participants?.length ?? null;
      for (const participant of entries) {
        const userKey = this.extractChatParticipantUserKey(participant);
        if (!userKey) {
          continue;
        }
        const user = usersMap.get(userKey);
        if (!user) {
          continue;
        }
        members.push(this.buildMemberRecordFromChat(user, participant));
        if (members.length >= limit) {
          break;
        }
      }
    } else if (participantsContainer instanceof Api.ChatParticipantsForbidden && participantsContainer.selfParticipant) {
      const userKey = this.extractChatParticipantUserKey(participantsContainer.selfParticipant);
      const user = userKey ? usersMap.get(userKey) : null;
      if (user) {
        members.push(this.buildMemberRecordFromChat(user, participantsContainer.selfParticipant));
      }
      total = null;
    }

    return { members, total };
  }

  private collectPrivateParticipant(user: Api.User): ParticipantCollection {
    const member: MemberRecord = {
      user,
      status: TelegramMemberStatus.MEMBER,
      isAdmin: false,
      isOwner: false,
      joinedAt: null,
      leftAt: null,
    };
    return { members: [member], total: 1 };
  }

  private async persistChat(resolved: ResolvedChat, members: MemberRecord[]) {
    return this.prisma.$transaction(async (tx) => {
      const chat = await tx.telegramChat.upsert({
        where: { telegramId: resolved.telegramId },
        create: {
          telegramId: resolved.telegramId,
          type: resolved.type,
          title: resolved.title,
          username: resolved.username,
          description: resolved.description,
        },
        update: {
          type: resolved.type,
          title: resolved.title,
          username: resolved.username,
          description: resolved.description,
        },
      });

      const membersPayload: TelegramMemberDto[] = [];

      for (const member of members) {
        const userRecord = await tx.telegramUser.upsert({
          where: { telegramId: this.toBigInt(member.user.id) },
          create: this.buildTelegramUserData(member.user),
          update: this.buildTelegramUserData(member.user),
        });

        const joinedAt = member.joinedAt ?? null;
        const leftAt = member.leftAt ?? null;

        await tx.telegramChatMember.upsert({
          where: {
            chatId_userId: {
              chatId: chat.id,
              userId: userRecord.id,
            },
          },
          create: {
            chatId: chat.id,
            userId: userRecord.id,
            status: member.status,
            isAdmin: member.isAdmin,
            isOwner: member.isOwner,
            joinedAt,
            leftAt,
          },
          update: {
            status: member.status,
            isAdmin: member.isAdmin,
            isOwner: member.isOwner,
            joinedAt,
            leftAt,
          },
        });

        membersPayload.push({
          userId: userRecord.id,
          telegramId: userRecord.telegramId.toString(),
          firstName: userRecord.firstName,
          lastName: userRecord.lastName,
          username: userRecord.username,
          phoneNumber: userRecord.phoneNumber,
          status: member.status,
          isAdmin: member.isAdmin,
          isOwner: member.isOwner,
          joinedAt: joinedAt ? joinedAt.toISOString() : null,
          leftAt: leftAt ? leftAt.toISOString() : null,
        });
      }

      return {
        chatId: chat.id,
        telegramId: chat.telegramId,
        members: membersPayload,
      };
    });
  }

  private buildMemberRecordFromChannel(user: Api.User, participant: Api.TypeChannelParticipant): MemberRecord {
    const meta = this.mapChannelParticipantStatus(participant);
    return {
      user,
      status: meta.status,
      isAdmin: meta.isAdmin,
      isOwner: meta.isOwner,
      joinedAt: meta.joinedAt,
      leftAt: meta.leftAt,
    };
  }

  private buildMemberRecordFromChat(user: Api.User, participant: Api.TypeChatParticipant): MemberRecord {
    const meta = this.mapChatParticipantStatus(participant);
    return {
      user,
      status: meta.status,
      isAdmin: meta.isAdmin,
      isOwner: meta.isOwner,
      joinedAt: meta.joinedAt,
      leftAt: meta.leftAt,
    };
  }

  private mapChannelParticipantStatus(participant: Api.TypeChannelParticipant) {
    if (participant instanceof Api.ChannelParticipantCreator) {
      return {
        status: TelegramMemberStatus.CREATOR,
        isAdmin: true,
        isOwner: true,
        joinedAt: null,
        leftAt: null,
      };
    }

    if (participant instanceof Api.ChannelParticipantAdmin) {
      return {
        status: TelegramMemberStatus.ADMINISTRATOR,
        isAdmin: true,
        isOwner: false,
        joinedAt: this.extractDate((participant as { date?: number | bigint }).date),
        leftAt: null,
      };
    }

    if (participant instanceof Api.ChannelParticipantBanned) {
      const status = participant.left ? TelegramMemberStatus.LEFT : TelegramMemberStatus.RESTRICTED;
      return {
        status,
        isAdmin: false,
        isOwner: false,
        joinedAt: this.extractDate((participant as { date?: number | bigint }).date),
        leftAt: this.extractDate(participant.bannedRights?.untilDate),
      };
    }

    if (participant instanceof Api.ChannelParticipantLeft) {
      return {
        status: TelegramMemberStatus.LEFT,
        isAdmin: false,
        isOwner: false,
        joinedAt: null,
        leftAt: null,
      };
    }

    return {
      status: TelegramMemberStatus.MEMBER,
      isAdmin: false,
      isOwner: false,
      joinedAt: this.extractDate((participant as { date?: number | bigint }).date),
      leftAt: null,
    };
  }

  private mapChatParticipantStatus(participant: Api.TypeChatParticipant) {
    if (participant instanceof Api.ChatParticipantCreator) {
      return {
        status: TelegramMemberStatus.CREATOR,
        isAdmin: true,
        isOwner: true,
        joinedAt: null,
        leftAt: null,
      };
    }

    if (participant instanceof Api.ChatParticipantAdmin) {
      return {
        status: TelegramMemberStatus.ADMINISTRATOR,
        isAdmin: true,
        isOwner: false,
        joinedAt: this.extractDate((participant as { date?: number | bigint }).date),
        leftAt: null,
      };
    }

    return {
      status: TelegramMemberStatus.MEMBER,
      isAdmin: false,
      isOwner: false,
      joinedAt: this.extractDate((participant as { date?: number | bigint }).date),
      leftAt: null,
    };
  }

  private buildTelegramUserData(user: Api.User) {
    return {
      telegramId: this.toBigInt(user.id),
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      username: user.username ?? null,
      phoneNumber: user.phone ?? null,
      bio: null,
      languageCode: user.langCode ?? null,
      isBot: Boolean(user.bot),
      isPremium: Boolean(user.premium),
    };
  }

  private buildUsersMap(users: Api.TypeUser[]) {
    const map = new Map<string, Api.User>();
    for (const entry of users) {
      if (entry instanceof Api.User) {
        map.set(this.bigIntKey(entry.id), entry);
      }
    }
    return map;
  }

  private extractChannelParticipantUserKey(participant: Api.TypeChannelParticipant): string | null {
    if ('userId' in participant && participant.userId !== undefined) {
      return this.bigIntKey(participant.userId);
    }
    if (participant instanceof Api.ChannelParticipantBanned || participant instanceof Api.ChannelParticipantLeft) {
      return this.extractPeerUserKey(participant.peer);
    }
    return null;
  }

  private extractChatParticipantUserKey(participant: Api.TypeChatParticipant): string | null {
    if ('userId' in participant && participant.userId !== undefined) {
      return this.bigIntKey(participant.userId);
    }
    return null;
  }

  private extractPeerUserKey(peer: Api.TypePeer | undefined): string | null {
    if (!peer) {
      return null;
    }
    if (peer instanceof Api.PeerUser) {
      return this.bigIntKey(peer.userId);
    }
    return null;
  }

  private composeUserTitle(user: Api.User): string | null {
    const parts = [user.firstName, user.lastName].filter((value): value is string => Boolean(value && value.trim().length > 0));
    if (parts.length === 0) {
      return user.username ?? null;
    }
    return parts.join(' ').trim();
  }

  private toBigInt(value: unknown): bigint {
    if (typeof value === 'bigint') {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return BigInt(Math.trunc(value));
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (/^-?\d+$/.test(trimmed)) {
        return BigInt(trimmed);
      }
    }
    if (value && typeof (value as { toString?: () => string }).toString === 'function') {
      const stringValue = (value as { toString: () => string }).toString();
      if (/^-?\d+$/.test(stringValue)) {
        return BigInt(stringValue);
      }
    }
    throw new Error('Unable to convert value to bigint');
  }

  private bigIntKey(value: unknown): string {
    return this.toBigInt(value).toString();
  }

  private toTelegramLong(value: unknown): BigInteger {
    if (value === undefined || value === null) {
      return bigInt.zero;
    }
    try {
      return bigInt(this.toBigInt(value).toString());
    } catch {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^-?\d+$/.test(trimmed)) {
          return bigInt(trimmed);
        }
      }
      return bigInt.zero;
    }
  }

  private extractDate(value: unknown): Date | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return new Date(value * 1000);
    }
    if (typeof value === 'bigint') {
      return new Date(Number(value) * 1000);
    }
    if (value && typeof value === 'object') {
      try {
        const parsed = this.toBigInt(value);
        return new Date(Number(parsed) * 1000);
      } catch {
        return null;
      }
    }
    return null;
  }
}

