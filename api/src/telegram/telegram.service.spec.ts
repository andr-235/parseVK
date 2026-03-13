import { vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  TelegramChatType,
  TelegramMemberStatus,
} from './types/telegram.enums.js';
import { Api } from 'telegram';
import type { TelegramMemberDto } from './dto/telegram-member.dto.js';
import { TelegramService } from './telegram.service.js';
import { TelegramClientManagerService } from './services/telegram-client-manager.service.js';
import { TelegramChatMapper } from './mappers/telegram-chat.mapper.js';
import { TelegramParticipantCollectorService } from './services/telegram-participant-collector.service.js';
import { TelegramChatSyncService } from './services/telegram-chat-sync.service.js';
import { TelegramExcelExporterService } from './services/telegram-excel-exporter.service.js';
import { TelegramChatRepository } from './repositories/telegram-chat.repository.js';
import { TelegramIdentifierResolverService } from './services/telegram-identifier-resolver.service.js';
import { TelegramDiscussionResolverService } from './services/telegram-discussion-resolver.service.js';
import { TelegramCommentAuthorCollectorService } from './services/telegram-comment-author-collector.service.js';
import type {
  ResolvedChat,
  ParticipantCollection,
  NormalizedTelegramIdentifier,
  DiscussionAuthorCollection,
  ResolvedDiscussionTarget,
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
  let identifierResolverMock: vi.Mocked<TelegramIdentifierResolverService>;
  let discussionResolverMock: vi.Mocked<TelegramDiscussionResolverService>;
  let commentCollectorMock: vi.Mocked<TelegramCommentAuthorCollectorService>;

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

    identifierResolverMock = {
      resolve: vi.fn(),
    } as unknown as vi.Mocked<TelegramIdentifierResolverService>;

    discussionResolverMock = {
      resolve: vi.fn(),
    } as unknown as vi.Mocked<TelegramDiscussionResolverService>;

    commentCollectorMock = {
      collectAuthors: vi.fn(),
    } as unknown as vi.Mocked<TelegramCommentAuthorCollectorService>;

    service = new TelegramService(
      clientManagerMock,
      identifierResolverMock,
      discussionResolverMock,
      chatMapperMock,
      participantCollectorMock,
      commentCollectorMock,
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
    const mockClient = {} as unknown as TelegramClient;

    clientManagerMock.getClient.mockResolvedValue(mockClient);
    identifierResolverMock.resolve.mockResolvedValue({
      identifier: {
        raw: '@test',
        normalized: 'test',
        kind: 'username',
        username: 'test',
      } satisfies NormalizedTelegramIdentifier,
      entity: fakeEntity,
    });

    const resolvedChat: ResolvedChat = {
      telegramId: BigInt(123),
      type: TelegramChatType.CHANNEL,
      title: 'Test channel',
      username: 'test_channel',
      description: null,
      accessHash: '987654321',
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

    expect(identifierResolverMock.resolve).toHaveBeenCalledWith(
      mockClient,
      'test',
    );
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

  it('rethrows resolver bad request errors', async () => {
    const mockClient = {} as TelegramClient;
    clientManagerMock.getClient.mockResolvedValue(mockClient);
    identifierResolverMock.resolve.mockRejectedValue(
      new BadRequestException('Cannot resolve Telegram chat by numeric ID'),
    );

    await expect(
      service.syncChat({ identifier: '-1001157519810' }),
    ).rejects.toThrow('Cannot resolve Telegram chat by numeric ID');
  });

  it('throws BadRequestException when thread mode has no messageId', async () => {
    const mockClient = {} as TelegramClient;
    clientManagerMock.getClient.mockResolvedValue(mockClient);
    discussionResolverMock.resolve.mockRejectedValue(
      new BadRequestException(
        'Для режима одного треда требуется messageId, если его нельзя извлечь из ссылки',
      ),
    );

    await expect(
      service.syncDiscussionAuthors({
        identifier: '@chatname',
        mode: 'thread',
      }),
    ).rejects.toThrow(
      'Для режима одного треда требуется messageId, если его нельзя извлечь из ссылки',
    );
  });

  it('returns unique comment authors for thread mode', async () => {
    const mockClient = {} as TelegramClient;
    const fakeEntity = {} as Api.Channel;
    const resolvedChat: ResolvedChat = {
      telegramId: BigInt(123),
      type: TelegramChatType.SUPERGROUP,
      title: 'Discussion chat',
      username: 'discussion_chat',
      description: null,
      accessHash: '987654321',
      entity: fakeEntity,
      totalMembers: null,
    };
    const discussionTarget: ResolvedDiscussionTarget = {
      resolvedChat,
      messageId: 115914,
      mode: 'thread',
      identifier: {
        raw: 'https://t.me/c/1949542659/115914',
        normalized: '-1001949542659',
        kind: 'channelNumericId',
        numericTelegramId: BigInt('1949542659'),
        messageId: 115914,
      } satisfies NormalizedTelegramIdentifier,
    };
    const authors: DiscussionAuthorCollection = {
      members: [
        {
          user: new Api.User({
            id: BigInt(777),
            firstName: 'Ivan',
            username: 'ivan',
          }),
          status: TelegramMemberStatus.MEMBER,
          isAdmin: false,
          isOwner: false,
          joinedAt: null,
          leftAt: null,
        },
      ],
      total: 1,
      fetchedMessages: 8,
      source: 'discussion_comments',
    };
    const persisted = {
      chatId: 17,
      telegramId: BigInt(123),
      members: [] as TelegramMemberDto[],
    };

    clientManagerMock.getClient.mockResolvedValue(mockClient);
    discussionResolverMock.resolve.mockResolvedValue(discussionTarget);
    commentCollectorMock.collectAuthors.mockResolvedValue(authors);
    chatSyncMock.persistChat.mockResolvedValue(persisted);

    const result = await service.syncDiscussionAuthors({
      identifier: 'https://t.me/c/1949542659/115914',
      mode: 'thread',
    });

    expect(discussionResolverMock.resolve).toHaveBeenCalledWith(mockClient, {
      identifier: 'https://t.me/c/1949542659/115914',
      mode: 'thread',
    });
    expect(commentCollectorMock.collectAuthors).toHaveBeenCalledWith(
      mockClient,
      discussionTarget,
      {
        authorLimit: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        messageLimit: undefined,
      },
    );
    expect(result).toEqual({
      chatId: 17,
      telegramId: '123',
      type: resolvedChat.type,
      title: resolvedChat.title,
      username: resolvedChat.username,
      syncedMembers: 1,
      totalMembers: 1,
      fetchedMembers: 1,
      fetchedMessages: 8,
      source: 'discussion_comments',
      mode: 'thread',
      members: [],
    });
  });
});
