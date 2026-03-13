import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { TelegramDiscussionResultDto } from './dto/telegram-discussion-result.dto.js';
import type { TelegramSyncResultDto } from './dto/telegram-sync-result.dto.js';
import type {
  SyncChatParams,
  SyncDiscussionAuthorsParams,
} from './types/telegram-sync.types.js';
import { TelegramClientManagerService } from './services/telegram-client-manager.service.js';
import { TelegramChatMapper } from './mappers/telegram-chat.mapper.js';
import { TelegramParticipantCollectorService } from './services/telegram-participant-collector.service.js';
import { TelegramChatSyncService } from './services/telegram-chat-sync.service.js';
import { TelegramExcelExporterService } from './services/telegram-excel-exporter.service.js';
import { TelegramChatRepository } from './repositories/telegram-chat.repository.js';
import type { ParticipantCollection } from './interfaces/telegram-client.interface.js';
import type { TelegramMemberDto } from './dto/telegram-member.dto.js';
import { TelegramIdentifierResolverService } from './services/telegram-identifier-resolver.service.js';
import { TelegramDiscussionResolverService } from './services/telegram-discussion-resolver.service.js';
import {
  TelegramCommentAuthorCollectorService,
  type DiscussionAuthorCollectOptions,
} from './services/telegram-comment-author-collector.service.js';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly defaultLimit = 1000;

  constructor(
    private readonly clientManager: TelegramClientManagerService,
    private readonly identifierResolver: TelegramIdentifierResolverService,
    private readonly discussionResolver: TelegramDiscussionResolverService,
    private readonly chatMapper: TelegramChatMapper,
    private readonly participantCollector: TelegramParticipantCollectorService,
    private readonly commentAuthorCollector: TelegramCommentAuthorCollectorService,
    private readonly chatSync: TelegramChatSyncService,
    private readonly excelExporter: TelegramExcelExporterService,
    private readonly chatRepository: TelegramChatRepository,
  ) {}

  async syncChat(params: SyncChatParams): Promise<TelegramSyncResultDto> {
    const identifier = params.identifier?.trim();
    if (!identifier) {
      throw new BadRequestException('Identifier is required');
    }

    const client = await this.clientManager.getClient();

    let entity: unknown;
    try {
      const resolution = await this.identifierResolver.resolve(
        client,
        identifier,
      );
      entity = resolution.entity;
    } catch (error) {
      this.logger.error(
        `Failed to resolve Telegram entity for "${identifier}"`,
        error as Error,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Unable to resolve Telegram chat by provided identifier',
      );
    }

    const resolved = this.chatMapper.resolveChat(entity);
    if (!resolved) {
      throw new BadRequestException(
        'Resolved Telegram entity is not a supported chat type',
      );
    }

    const limit = params.limit ?? this.defaultLimit;

    let collection: ParticipantCollection;
    try {
      collection = await this.participantCollector.collectParticipants(
        client,
        resolved,
        limit,
      );
    } catch (error) {
      this.logger.error(
        `Failed to collect participants for "${identifier}"`,
        error as Error,
      );
      throw new InternalServerErrorException(
        'Unable to fetch Telegram chat participants',
      );
    }

    const persisted = await this.chatSync.persistChat(
      resolved,
      collection.members,
      client,
      params.enrichWithFullData ?? false,
    );

    return {
      chatId: (persisted as { chatId: number }).chatId,
      telegramId: (persisted as { telegramId: bigint }).telegramId.toString(),
      type: resolved.type,
      title: resolved.title,
      username: resolved.username,
      syncedMembers: collection.members.length,
      totalMembers: collection.total ?? null,
      fetchedMembers: collection.members.length,
      members: (persisted as { members: TelegramMemberDto[] }).members,
    };
  }

  async exportChatToExcel(chatId: number): Promise<Buffer> {
    return this.excelExporter.exportChatToExcel(chatId);
  }

  async syncDiscussionAuthors(
    params: SyncDiscussionAuthorsParams,
  ): Promise<TelegramDiscussionResultDto> {
    const identifier = params.identifier?.trim();
    if (!identifier) {
      throw new BadRequestException('Identifier is required');
    }

    const client = await this.clientManager.getClient();

    let target;
    try {
      target = await this.discussionResolver.resolve(client, {
        identifier,
        mode: params.mode,
        messageId: params.messageId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to resolve Telegram discussion for "${identifier}"`,
        error as Error,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Не удалось разрешить обсуждение Telegram по указанному идентификатору',
      );
    }

    const collectOptions: DiscussionAuthorCollectOptions = {
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      messageLimit: params.messageLimit,
      authorLimit: params.authorLimit,
    };

    let collection;
    try {
      collection = await this.commentAuthorCollector.collectAuthors(
        client,
        target,
        collectOptions,
      );
    } catch (error) {
      this.logger.error(
        `Failed to collect discussion authors for "${identifier}"`,
        error as Error,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Не удалось получить авторов комментариев Telegram',
      );
    }

    const persisted = await this.chatSync.persistChat(
      target.resolvedChat,
      collection.members,
      client,
      false,
    );

    return {
      chatId: persisted.chatId,
      telegramId: persisted.telegramId.toString(),
      type: target.resolvedChat.type,
      title: target.resolvedChat.title,
      username: target.resolvedChat.username,
      syncedMembers: collection.members.length,
      totalMembers: collection.total ?? null,
      fetchedMembers: collection.members.length,
      fetchedMessages: collection.fetchedMessages,
      source: collection.source,
      mode: target.mode,
      members: persisted.members,
    };
  }

  async getChatInfo(chatId: number): Promise<unknown> {
    const chat = await this.chatRepository.findById(chatId);

    if (!chat) {
      throw new BadRequestException('Chat not found');
    }

    return chat;
  }
}
