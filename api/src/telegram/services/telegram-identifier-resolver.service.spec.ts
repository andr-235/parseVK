import { BadRequestException } from '@nestjs/common';
import { Api } from 'telegram';
import { describe, expect, it, vi } from 'vitest';
import { TelegramChatType } from '../types/telegram.enums.js';
import { TelegramIdentifierResolverService } from './telegram-identifier-resolver.service.js';
import { TelegramChatRepository } from '../repositories/telegram-chat.repository.js';
import type { TelegramClient } from 'telegram';

describe('TelegramIdentifierResolverService', () => {
  const createRepositoryMock = () =>
    ({
      findResolutionMetadataByTelegramId: vi.fn(),
    }) as unknown as vi.Mocked<TelegramChatRepository>;

  const createClientMock = () =>
    ({
      getEntity: vi.fn(),
      getInputEntity: vi.fn(),
      invoke: vi.fn(),
    }) as unknown as TelegramClient;

  it('resolves username via client.getEntity', async () => {
    const repository = createRepositoryMock();
    const service = new TelegramIdentifierResolverService(repository);
    const client = createClientMock() as unknown as {
      getEntity: ReturnType<typeof vi.fn>;
    };
    const entity = { className: 'Channel' };

    client.getEntity.mockResolvedValue(entity);

    const result = await service.resolve(
      client as unknown as TelegramClient,
      '@durov',
    );

    expect(client.getEntity).toHaveBeenCalledWith('durov');
    expect(result.identifier).toMatchObject({
      kind: 'username',
      username: 'durov',
    });
    expect(result.entity).toBe(entity);
  });

  it('resolves public link via client.getEntity', async () => {
    const repository = createRepositoryMock();
    const service = new TelegramIdentifierResolverService(repository);
    const client = createClientMock() as unknown as {
      getEntity: ReturnType<typeof vi.fn>;
    };
    const entity = { className: 'Channel' };

    client.getEntity.mockResolvedValue(entity);

    const result = await service.resolve(
      client as unknown as TelegramClient,
      'https://t.me/durov',
    );

    expect(client.getEntity).toHaveBeenCalledWith('durov');
    expect(result.identifier).toMatchObject({
      kind: 'publicLink',
      username: 'durov',
    });
    expect(result.entity).toBe(entity);
  });

  it('resolves known channel numeric id from repository metadata', async () => {
    const repository = createRepositoryMock() as unknown as {
      findResolutionMetadataByTelegramId: ReturnType<typeof vi.fn>;
    };
    const service = new TelegramIdentifierResolverService(
      repository as unknown as TelegramChatRepository,
    );
    const client = createClientMock() as unknown as {
      invoke: ReturnType<typeof vi.fn>;
    };
    const channel = new Api.Channel({
      id: BigInt('1157519810'),
      title: 'Known channel',
      accessHash: BigInt('987654321'),
      broadcast: true,
    });

    repository.findResolutionMetadataByTelegramId.mockResolvedValue({
      telegramId: BigInt('1157519810'),
      type: TelegramChatType.CHANNEL,
      username: null,
      accessHash: '987654321',
    });
    client.invoke.mockResolvedValue({
      chats: [channel],
    });

    const result = await service.resolve(
      client as unknown as TelegramClient,
      '-1001157519810',
    );

    expect(repository.findResolutionMetadataByTelegramId).toHaveBeenCalledWith(
      BigInt('1157519810'),
    );
    expect(client.invoke).toHaveBeenCalledTimes(1);
    expect(result.entity).toBe(channel);
  });

  it('throws BadRequestException for unknown numeric channel id', async () => {
    const repository = createRepositoryMock() as unknown as {
      findResolutionMetadataByTelegramId: ReturnType<typeof vi.fn>;
    };
    const service = new TelegramIdentifierResolverService(
      repository as unknown as TelegramChatRepository,
    );
    const client = createClientMock();

    repository.findResolutionMetadataByTelegramId.mockResolvedValue(null);

    await expect(service.resolve(client, '-1001157519810')).rejects.toThrow(
      'Нельзя выполнить первый sync только по внутреннему Telegram ID.',
    );
  });

  it('resolves unknown numeric channel id via direct Telegram client lookup', async () => {
    const repository = createRepositoryMock() as unknown as {
      findResolutionMetadataByTelegramId: ReturnType<typeof vi.fn>;
    };
    const service = new TelegramIdentifierResolverService(
      repository as unknown as TelegramChatRepository,
    );
    const client = createClientMock() as unknown as {
      getInputEntity: ReturnType<typeof vi.fn>;
      getEntity: ReturnType<typeof vi.fn>;
    };
    const inputPeer = { className: 'InputPeerChannel' };
    const channel = { className: 'Channel', id: BigInt('1157519810') };

    repository.findResolutionMetadataByTelegramId.mockResolvedValue(null);
    client.getInputEntity.mockResolvedValue(inputPeer);
    client.getEntity.mockResolvedValue(channel);

    const result = await service.resolve(
      client as unknown as TelegramClient,
      '-1001157519810',
    );

    expect(client.getInputEntity).toHaveBeenCalledWith('-1001157519810');
    expect(client.getEntity).toHaveBeenCalledWith(inputPeer);
    expect(result.entity).toBe(channel);
  });

  it('throws the same bootstrap error for unknown internal t.me/c link', async () => {
    const repository = createRepositoryMock() as unknown as {
      findResolutionMetadataByTelegramId: ReturnType<typeof vi.fn>;
    };
    const service = new TelegramIdentifierResolverService(
      repository as unknown as TelegramChatRepository,
    );
    const client = createClientMock();

    repository.findResolutionMetadataByTelegramId.mockResolvedValue(null);
    (client as unknown as { getInputEntity: ReturnType<typeof vi.fn> })
      .getInputEntity.mockRejectedValue(new Error('Could not find input entity'));

    await expect(
      service.resolve(client, 'https://t.me/c/1949542659/115914'),
    ).rejects.toThrow(
      'Нельзя выполнить первый sync только по внутреннему Telegram ID.',
    );
  });

  it('throws BadRequestException for invalid format', async () => {
    const repository = createRepositoryMock();
    const service = new TelegramIdentifierResolverService(repository);
    const client = createClientMock();

    await expect(service.resolve(client, '@@@')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
