import { BadRequestException, Injectable } from '@nestjs/common';
import bigInt from 'big-integer';
import { Api, type TelegramClient } from 'telegram';
import { TelegramChatType as PrismaTelegramChatType } from '../../generated/prisma/enums.js';
import type { NormalizedTelegramIdentifier } from '../interfaces/telegram-client.interface.js';
import { TelegramChatRepository } from '../repositories/telegram-chat.repository.js';
import { normalizeTelegramIdentifier } from '../utils/normalize-telegram-identifier.util.js';

interface ResolvedTelegramEntity {
  identifier: NormalizedTelegramIdentifier;
  entity: unknown;
}

@Injectable()
export class TelegramIdentifierResolverService {
  constructor(private readonly chatRepository: TelegramChatRepository) {}

  async resolve(
    client: TelegramClient,
    rawIdentifier: string,
  ): Promise<ResolvedTelegramEntity> {
    const identifier = normalizeTelegramIdentifier(rawIdentifier);

    if (identifier.kind === 'invalid') {
      throw new BadRequestException(
        'Неподдерживаемый формат идентификатора Telegram',
      );
    }

    if (identifier.kind === 'inviteLink') {
      throw new BadRequestException(
        'Invite-ссылки требуют явного сценария вступления в чат',
      );
    }

    if (identifier.kind === 'username' || identifier.kind === 'publicLink') {
      return {
        identifier,
        entity: await client.getEntity(
          identifier.username ?? identifier.normalized,
        ),
      };
    }

    return this.resolveByNumericId(client, identifier);
  }

  private async resolveByNumericId(
    client: TelegramClient,
    identifier: NormalizedTelegramIdentifier,
  ): Promise<ResolvedTelegramEntity> {
    const telegramId = identifier.numericTelegramId;
    if (!telegramId) {
      throw new BadRequestException(
        'Идентификатор Telegram не содержит числовой идентификатор чата',
      );
    }

    const directEntity = await this.tryResolveDirectlyByNumericId(
      client,
      identifier.normalized,
    );
    if (directEntity) {
      return {
        identifier,
        entity: directEntity,
      };
    }

    const metadata =
      await this.chatRepository.findResolutionMetadataByTelegramId(telegramId);

    if (!metadata) {
      throw new BadRequestException(
        'Нельзя выполнить первый sync только по внутреннему Telegram ID. Сначала используйте @username, публичную или invite-ссылку. После первого успешного sync внутренние идентификаторы вроде -100... и t.me/c/... будут работать.',
      );
    }

    if (metadata.username) {
      return {
        identifier,
        entity: await client.getEntity(metadata.username),
      };
    }

    if (
      (metadata.type === PrismaTelegramChatType.CHANNEL ||
        metadata.type === PrismaTelegramChatType.SUPERGROUP) &&
      metadata.accessHash
    ) {
      const response = await client.invoke(
        new Api.channels.GetChannels({
          id: [
            new Api.InputChannel({
              channelId: bigInt(telegramId.toString()),
              accessHash: bigInt(metadata.accessHash),
            }),
          ],
        }),
      );

      if ('chats' in response && response.chats.length > 0) {
        return {
          identifier,
          entity: response.chats[0],
        };
      }
    }

    throw new BadRequestException(
      'Не удалось открыть чат Telegram по числовому ID без сохранённого access hash',
    );
  }

  private async tryResolveDirectlyByNumericId(
    client: TelegramClient,
    normalizedIdentifier: string,
  ): Promise<object | null> {
    try {
      const inputPeer = await client.getInputEntity(normalizedIdentifier);
      return (await client.getEntity(inputPeer)) as object;
    } catch {
      return null;
    }
  }
}
