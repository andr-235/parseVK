/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { TelegramChatType, TelegramMemberStatus } from '@prisma/client';
import type { Api } from 'telegram';
import type { TelegramMemberDto } from './dto/telegram-member.dto';
import { TelegramService } from './telegram.service';
import { TelegramClientManagerService } from './services/telegram-client-manager.service';
import { TelegramChatMapper } from './mappers/telegram-chat.mapper';
import { TelegramParticipantCollectorService } from './services/telegram-participant-collector.service';
import { TelegramChatSyncService } from './services/telegram-chat-sync.service';
import { TelegramExcelExporterService } from './services/telegram-excel-exporter.service';
import { TelegramChatRepository } from './repositories/telegram-chat.repository';
import type {
  ResolvedChat,
  ParticipantCollection,
} from './interfaces/telegram-client.interface';
import type { TelegramClient } from 'telegram';

describe('TelegramService', () => {
  let service: TelegramService;
  let clientManagerMock: jest.Mocked<TelegramClientManagerService>;
  let chatMapperMock: jest.Mocked<TelegramChatMapper>;
  let participantCollectorMock: jest.Mocked<TelegramParticipantCollectorService>;
  let chatSyncMock: jest.Mocked<TelegramChatSyncService>;
  let excelExporterMock: jest.Mocked<TelegramExcelExporterService>;
  let chatRepositoryMock: jest.Mocked<TelegramChatRepository>;

  beforeEach(() => {
    clientManagerMock = {
      getClient: jest.fn(),
      disconnect: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as unknown as jest.Mocked<TelegramClientManagerService>;

    chatMapperMock = {
      resolveChat: jest.fn(),
      composeUserTitle: jest.fn(),
      toBigInt: jest.fn(),
    } as unknown as jest.Mocked<TelegramChatMapper>;

    participantCollectorMock = {
      collectParticipants: jest.fn(),
    } as unknown as jest.Mocked<TelegramParticipantCollectorService>;

    chatSyncMock = {
      persistChat: jest.fn(),
    } as unknown as jest.Mocked<TelegramChatSyncService>;

    excelExporterMock = {
      exportChatToExcel: jest.fn(),
    } as unknown as jest.Mocked<TelegramExcelExporterService>;

    chatRepositoryMock = {
      findById: jest.fn(),
      findByTelegramId: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<TelegramChatRepository>;

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
    jest.restoreAllMocks();
  });

  it('throws BadRequestException when identifier is empty', async () => {
    await expect(
      service.syncChat({ identifier: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns sync result with persisted data', async () => {
    const fakeEntity = {};
    const mockClient = {
      getEntity: jest.fn().mockResolvedValue(fakeEntity),
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
