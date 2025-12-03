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
    } as any;

    chatMapperMock = {
      resolveChat: jest.fn(),
    } as any;

    participantCollectorMock = {
      collectParticipants: jest.fn(),
    } as any;

    chatSyncMock = {
      persistChat: jest.fn(),
    } as any;

    excelExporterMock = {
      exportChatToExcel: jest.fn(),
    } as any;

    chatRepositoryMock = {
      findById: jest.fn(),
    } as any;

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
    } as Record<string, unknown>;

    clientManagerMock.getClient.mockResolvedValue(mockClient as any);

    const resolvedChat = {
      telegramId: BigInt(123),
      type: TelegramChatType.CHANNEL,
      title: 'Test channel',
      username: 'test_channel',
      description: null,
      entity: {} as Record<string, unknown>,
      totalMembers: 42,
    };
    chatMapperMock.resolveChat.mockReturnValue(resolvedChat as any);

    const participants = {
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
      participants as any,
    );

    const persisted = {
      chatId: 17,
      telegramId: BigInt(123),
      members: [] as TelegramMemberDto[],
    };
    chatSyncMock.persistChat.mockResolvedValue(persisted as any);

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
