import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { TelegramSyncResultDto } from './dto/telegram-sync-result.dto.js';
import type { SyncChatParams } from './types/telegram-sync.types.js';
import { TelegramClientManagerService } from './services/telegram-client-manager.service.js';
import { TelegramChatMapper } from './mappers/telegram-chat.mapper.js';
import { TelegramParticipantCollectorService } from './services/telegram-participant-collector.service.js';
import { TelegramChatSyncService } from './services/telegram-chat-sync.service.js';
import { TelegramExcelExporterService } from './services/telegram-excel-exporter.service.js';
import { TelegramChatRepository } from './repositories/telegram-chat.repository.js';
import type { ParticipantCollection } from './interfaces/telegram-client.interface.js';
import type { TelegramMemberDto } from './dto/telegram-member.dto.js';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly defaultLimit = 1000;

  constructor(
    private readonly clientManager: TelegramClientManagerService,
    private readonly chatMapper: TelegramChatMapper,
    private readonly participantCollector: TelegramParticipantCollectorService,
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
      entity = await client.getEntity(identifier);
    } catch (error) {
      this.logger.error(
        `Failed to resolve Telegram entity for "${identifier}"`,
        error as Error,
      );
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

  async getChatInfo(chatId: number): Promise<unknown> {
    const chat = await this.chatRepository.findById(chatId);

    if (!chat) {
      throw new BadRequestException('Chat not found');
    }

    return chat;
  }
}
