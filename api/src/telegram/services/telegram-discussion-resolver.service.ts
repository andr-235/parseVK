import { BadRequestException, Injectable } from '@nestjs/common';
import type { TelegramClient } from 'telegram';
import { TelegramChatMapper } from '../mappers/telegram-chat.mapper.js';
import { TelegramIdentifierResolverService } from './telegram-identifier-resolver.service.js';
import type { ResolvedDiscussionTarget } from '../interfaces/telegram-client.interface.js';
import type { SyncDiscussionAuthorsParams } from '../types/telegram-sync.types.js';

@Injectable()
export class TelegramDiscussionResolverService {
  constructor(
    private readonly identifierResolver: TelegramIdentifierResolverService,
    private readonly chatMapper: TelegramChatMapper,
  ) {}

  async resolve(
    client: TelegramClient,
    params: Pick<
      SyncDiscussionAuthorsParams,
      'identifier' | 'mode' | 'messageId'
    >,
  ): Promise<ResolvedDiscussionTarget> {
    if (params.mode !== 'thread' && params.mode !== 'chatRange') {
      throw new BadRequestException(
        'Неподдерживаемый режим синхронизации обсуждения',
      );
    }

    const resolution = await this.identifierResolver.resolve(
      client,
      params.identifier,
    );
    const resolvedChat = this.chatMapper.resolveChat(resolution.entity);
    if (!resolvedChat) {
      throw new BadRequestException(
        'Resolved Telegram entity is not a supported chat type',
      );
    }

    const messageId = params.messageId ?? resolution.identifier.messageId;
    if (params.mode === 'thread' && !messageId) {
      throw new BadRequestException(
        'Для режима одного треда требуется messageId, если его нельзя извлечь из ссылки',
      );
    }

    return {
      identifier: resolution.identifier,
      resolvedChat,
      mode: params.mode,
      messageId,
    };
  }
}
