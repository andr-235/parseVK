var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramService_1;
import { BadRequestException, Injectable, InternalServerErrorException, Logger, } from '@nestjs/common';
import { TelegramClientManagerService } from './services/telegram-client-manager.service.js';
import { TelegramChatMapper } from './mappers/telegram-chat.mapper.js';
import { TelegramParticipantCollectorService } from './services/telegram-participant-collector.service.js';
import { TelegramChatSyncService } from './services/telegram-chat-sync.service.js';
import { TelegramExcelExporterService } from './services/telegram-excel-exporter.service.js';
import { TelegramChatRepository } from './repositories/telegram-chat.repository.js';
import { TelegramIdentifierResolverService } from './services/telegram-identifier-resolver.service.js';
import { TelegramDiscussionResolverService } from './services/telegram-discussion-resolver.service.js';
import { TelegramCommentAuthorCollectorService, } from './services/telegram-comment-author-collector.service.js';
let TelegramService = TelegramService_1 = class TelegramService {
    clientManager;
    identifierResolver;
    discussionResolver;
    chatMapper;
    participantCollector;
    commentAuthorCollector;
    chatSync;
    excelExporter;
    chatRepository;
    logger = new Logger(TelegramService_1.name);
    defaultLimit = 1000;
    constructor(clientManager, identifierResolver, discussionResolver, chatMapper, participantCollector, commentAuthorCollector, chatSync, excelExporter, chatRepository) {
        this.clientManager = clientManager;
        this.identifierResolver = identifierResolver;
        this.discussionResolver = discussionResolver;
        this.chatMapper = chatMapper;
        this.participantCollector = participantCollector;
        this.commentAuthorCollector = commentAuthorCollector;
        this.chatSync = chatSync;
        this.excelExporter = excelExporter;
        this.chatRepository = chatRepository;
    }
    async syncChat(params) {
        const identifier = params.identifier?.trim();
        if (!identifier) {
            throw new BadRequestException('Identifier is required');
        }
        const client = await this.clientManager.getClient();
        let entity;
        try {
            const resolution = await this.identifierResolver.resolve(client, identifier);
            entity = resolution.entity;
        }
        catch (error) {
            this.logger.error(`Failed to resolve Telegram entity for "${identifier}"`, error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Unable to resolve Telegram chat by provided identifier');
        }
        const resolved = this.chatMapper.resolveChat(entity);
        if (!resolved) {
            throw new BadRequestException('Resolved Telegram entity is not a supported chat type');
        }
        const limit = params.limit ?? this.defaultLimit;
        let collection;
        try {
            collection = await this.participantCollector.collectParticipants(client, resolved, limit);
        }
        catch (error) {
            this.logger.error(`Failed to collect participants for "${identifier}"`, error);
            throw new InternalServerErrorException('Unable to fetch Telegram chat participants');
        }
        const persisted = await this.chatSync.persistChat(resolved, collection.members, client, params.enrichWithFullData ?? false);
        return {
            chatId: persisted.chatId,
            telegramId: persisted.telegramId.toString(),
            type: resolved.type,
            title: resolved.title,
            username: resolved.username,
            syncedMembers: collection.members.length,
            totalMembers: collection.total ?? null,
            fetchedMembers: collection.members.length,
            members: persisted.members,
        };
    }
    async exportChatToExcel(chatId) {
        return this.excelExporter.exportChatToExcel(chatId);
    }
    async syncDiscussionAuthors(params) {
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
        }
        catch (error) {
            this.logger.error(`Failed to resolve Telegram discussion for "${identifier}"`, error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Не удалось разрешить обсуждение Telegram по указанному идентификатору');
        }
        const collectOptions = {
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            messageLimit: params.messageLimit,
            authorLimit: params.authorLimit,
        };
        let collection;
        try {
            collection = await this.commentAuthorCollector.collectAuthors(client, target, collectOptions);
        }
        catch (error) {
            this.logger.error(`Failed to collect discussion authors for "${identifier}"`, error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Не удалось получить авторов комментариев Telegram');
        }
        const persisted = await this.chatSync.persistChat(target.resolvedChat, collection.members, client, false);
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
    async getChatInfo(chatId) {
        const chat = await this.chatRepository.findById(chatId);
        if (!chat) {
            throw new BadRequestException('Chat not found');
        }
        return chat;
    }
};
TelegramService = TelegramService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TelegramClientManagerService,
        TelegramIdentifierResolverService,
        TelegramDiscussionResolverService,
        TelegramChatMapper,
        TelegramParticipantCollectorService,
        TelegramCommentAuthorCollectorService,
        TelegramChatSyncService,
        TelegramExcelExporterService,
        TelegramChatRepository])
], TelegramService);
export { TelegramService };
//# sourceMappingURL=telegram.service.js.map