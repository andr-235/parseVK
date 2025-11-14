import { BadRequestException } from '@nestjs/common';
import { TelegramChatType, TelegramMemberStatus } from '@prisma/client';
import type { Api } from 'telegram';
import type { TelegramMemberDto } from './dto/telegram-member.dto';
import { TelegramService } from './telegram.service';

describe('TelegramService', () => {
  const mockConfig = {
    get: jest.fn(),
  };
  const mockPrisma = {};

  let service: TelegramService;

  beforeEach(() => {
    jest.resetModules();
    service = new TelegramService(mockConfig as never, mockPrisma as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws BadRequestException when identifier is empty', async () => {
    await expect(service.syncChat({ identifier: '   ' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns sync result with persisted data', async () => {
    const fakeEntity = {};
    const mockClient = {
      getEntity: jest.fn().mockResolvedValue(fakeEntity),
    } as Record<string, unknown>;

    const prototype = Object.getPrototypeOf(service) as Record<string, unknown>;
    jest.spyOn(prototype, 'getClient').mockResolvedValue(mockClient);

    const resolvedChat = {
      telegramId: BigInt(123),
      type: TelegramChatType.CHANNEL,
      title: 'Test channel',
      username: 'test_channel',
      description: null,
      entity: {} as Record<string, unknown>,
      totalMembers: 42,
    };
    jest.spyOn(prototype, 'resolveChat').mockReturnValue(resolvedChat);

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
    jest.spyOn(prototype, 'collectParticipants').mockResolvedValue(participants);

    const persisted = {
      chatId: 17,
      telegramId: BigInt(123),
      members: [] as TelegramMemberDto[],
    };
    jest.spyOn(prototype, 'persistChat').mockResolvedValue(persisted);

    const result = await service.syncChat({ identifier: 'test', limit: 10 });

    expect(mockClient.getEntity).toHaveBeenCalledWith('test');
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

