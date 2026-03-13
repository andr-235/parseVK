import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TelegramChatType } from '../types/telegram.enums.js';
import { TelegramDiscussionResolverService } from './telegram-discussion-resolver.service.js';
import { TelegramIdentifierResolverService } from './telegram-identifier-resolver.service.js';
import { TelegramChatMapper } from '../mappers/telegram-chat.mapper.js';
import type {
  NormalizedTelegramIdentifier,
  ResolvedChat,
} from '../interfaces/telegram-client.interface.js';
import type { TelegramClient } from 'telegram';

describe('TelegramDiscussionResolverService', () => {
  const createIdentifierResolverMock = () =>
    ({
      resolve: vi.fn(),
    }) as unknown as vi.Mocked<TelegramIdentifierResolverService>;

  const createChatMapperMock = () =>
    ({
      resolveChat: vi.fn(),
    }) as unknown as vi.Mocked<TelegramChatMapper>;

  it('extracts messageId from internal discussion link', async () => {
    const identifierResolver = createIdentifierResolverMock() as unknown as {
      resolve: ReturnType<typeof vi.fn>;
    };
    const chatMapper = createChatMapperMock() as unknown as {
      resolveChat: ReturnType<typeof vi.fn>;
    };
    const service = new TelegramDiscussionResolverService(
      identifierResolver as unknown as TelegramIdentifierResolverService,
      chatMapper as unknown as TelegramChatMapper,
    );
    const client = {} as TelegramClient;
    const resolvedChat: ResolvedChat = {
      telegramId: BigInt(1949542659),
      type: TelegramChatType.SUPERGROUP,
      title: 'Discussion chat',
      username: null,
      description: null,
      accessHash: '123',
      entity: {} as ResolvedChat['entity'],
      totalMembers: null,
    };

    identifierResolver.resolve.mockResolvedValue({
      identifier: {
        raw: 'https://t.me/c/1949542659/115914',
        normalized: '-1001949542659',
        kind: 'channelNumericId',
        numericTelegramId: BigInt(1949542659),
        messageId: 115914,
      } satisfies NormalizedTelegramIdentifier,
      entity: resolvedChat.entity,
    });
    chatMapper.resolveChat.mockReturnValue(resolvedChat);

    const result = await service.resolve(client, {
      identifier: 'https://t.me/c/1949542659/115914',
      mode: 'thread',
    });

    expect(result.messageId).toBe(115914);
  });

  it('throws russian error when thread mode has no message id', async () => {
    const identifierResolver = createIdentifierResolverMock() as unknown as {
      resolve: ReturnType<typeof vi.fn>;
    };
    const chatMapper = createChatMapperMock() as unknown as {
      resolveChat: ReturnType<typeof vi.fn>;
    };
    const service = new TelegramDiscussionResolverService(
      identifierResolver as unknown as TelegramIdentifierResolverService,
      chatMapper as unknown as TelegramChatMapper,
    );
    const client = {} as TelegramClient;

    identifierResolver.resolve.mockResolvedValue({
      identifier: {
        raw: '@chatname',
        normalized: 'chatname',
        kind: 'username',
        username: 'chatname',
      } satisfies NormalizedTelegramIdentifier,
      entity: {},
    });
    chatMapper.resolveChat.mockReturnValue({
      telegramId: BigInt(1),
      type: TelegramChatType.SUPERGROUP,
      title: 'Chat',
      username: 'chatname',
      description: null,
      accessHash: null,
      entity: {} as ResolvedChat['entity'],
      totalMembers: null,
    });

    await expect(
      service.resolve(client, {
        identifier: '@chatname',
        mode: 'thread',
      }),
    ).rejects.toThrow(
      'Для режима одного треда требуется messageId, если его нельзя извлечь из ссылки',
    );
  });

  it('throws BadRequestException for unsupported mode', async () => {
    const identifierResolver = createIdentifierResolverMock();
    const chatMapper = createChatMapperMock();
    const service = new TelegramDiscussionResolverService(
      identifierResolver,
      chatMapper,
    );

    await expect(
      service.resolve({} as TelegramClient, {
        identifier: '@chatname',
        mode: 'nope' as 'thread',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
