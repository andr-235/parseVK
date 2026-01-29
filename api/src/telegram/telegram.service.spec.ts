/* eslint-disable @typescript-eslint/unbound-method */
import { vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  TelegramChatType,
  TelegramMemberStatus,
} from './types/telegram.enums.js';
import type { Api } from 'telegram';
import type { TelegramMemberDto } from './dto/telegram-member.dto.js';
import { TelegramService } from './telegram.service.js';
import { TelegramClientManagerService } from './services/telegram-client-manager.service.js';
import { TelegramChatMapper } from './mappers/telegram-chat.mapper.js';
import { TelegramParticipantCollectorService } from './services/telegram-participant-collector.service.js';
import { TelegramChatSyncService } from './services/telegram-chat-sync.service.js';
import { TelegramExcelExporterService } from './services/telegram-excel-exporter.service.js';
import { TelegramChatRepository } from './repositories/telegram-chat.repository.js';
import type {
  ResolvedChat,
  ParticipantCollection,
} from './interfaces/telegram-client.interface.js';
import type { TelegramClient } from 'telegram';

describe('TelegramService', () => {
  let service: TelegramService;
  let clientManagerMock: vi.Mocked<TelegramClientManagerService>;
  let chatMapperMock: vi.Mocked<TelegramChatMapper>;
  let participantCollectorMock: vi.Mocked<TelegramParticipantCollectorService>;
  let chatSyncMock: vi.Mocked<TelegramChatSyncService>;
  let excelExporterMock: vi.Mocked<TelegramExcelExporterService>;
  let chatRepositoryMock: vi.Mocked<TelegramChatRepository>;

  beforeEach(() => {
    clientManagerMock = {
      getClient: vi.fn(),
      disconnect: vi.fn(),
      onModuleDestroy: vi.fn(),
    } as unknown as vi.Mocked<TelegramClientManagerService>;

    chatMapperMock = {
      resolveChat: vi.fn(),
      composeUserTitle: vi.fn(),
      toBigInt: vi.fn(),
    } as unknown as vi.Mocked<TelegramChatMapper>;

    participantCollectorMock = {
      collectParticipants: vi.fn(),
    } as unknown as vi.Mocked<TelegramParticipantCollectorService>;

    chatSyncMock = {
      persistChat: vi.fn(),
    } as unknown as vi.Mocked<TelegramChatSyncService>;

    excelExporterMock = {
      exportChatToExcel: vi.fn(),
    } as unknown as vi.Mocked<TelegramExcelExporterService>;

    chatRepositoryMock = {
      findById: vi.fn(),
      findByTelegramId: vi.fn(),
      upsert: vi.fn(),
    } as unknown as vi.Mocked<TelegramChatRepository>;

    service = new TelegramService(
      clientManagerMock,
      chatMapperMock,
      participantCollectorMock,
      chatSyncMock,
      excelExporterMock,
      chatRepositoryMock,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws BadRequestException when identifier is empty', async () => {
    await expect(
      service.syncChat({ identifier: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns sync result with persisted data', async () => {
    const fakeEntity = {};
    const mockClient = {
      getEntity: vi.fn().mockResolvedValue(fakeEntity),
    } as unknown as TelegramClient;

    clientManagerMock.getClient.mockResolvedValue(mockClient);

    const resolvedChat: ResolvedChat = {
      telegramId: BigInt(123),
      type: TelegramChatType.CHANNEL,
      title: 'Test channel',
      username: 'test_channel',
      description: null,
      entity: {} as Api.Channel,
      totalMembers: 42,
    };
    chatMapperMock.resolveChat.mockReturnValue(resolvedChat);

    const participants: ParticipantCollection = {
      members: [
        {
          user: {} as Api.User,
          status: TelegramMemberStatus.MEMBER,
          isAdmin: false,
          isOwner: false,
          joinedAt: null,
          leftAt: null,
        },
      ],
      total: 42,
    };
    participantCollectorMock.collectParticipants.mockResolvedValue(
      participants,
    );

    const persisted = {
      chatId: 17,
      telegramId: BigInt(123),
      members: [] as TelegramMemberDto[],
    };
    chatSyncMock.persistChat.mockResolvedValue(persisted);

    const result = await service.syncChat({ identifier: 'test', limit: 10 });

    expect(mockClient.getEntity).toHaveBeenCalledWith('test');
    expect(chatMapperMock.resolveChat).toHaveBeenCalledWith(fakeEntity);
    expect(participantCollectorMock.collectParticipants).toHaveBeenCalled();
    expect(chatSyncMock.persistChat).toHaveBeenCalled();
    expect(result).toEqual({
      chatId: persisted.chatId,
      telegramId: persisted.telegramId.toString(),
      type: resolvedChat.type,
      title: resolvedChat.title,
      username: resolvedChat.username,
      syncedMembers: participants.members.length,
      totalMembers: participants.total,
      fetchedMembers: participants.members.length,
      members: persisted.members,
    });
  });
});
