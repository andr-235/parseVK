var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable } from '@nestjs/common';
import { TelegramChatMapper } from '../mappers/telegram-chat.mapper.js';
import { TelegramIdentifierResolverService } from './telegram-identifier-resolver.service.js';
let TelegramDiscussionResolverService = class TelegramDiscussionResolverService {
    identifierResolver;
    chatMapper;
    constructor(identifierResolver, chatMapper) {
        this.identifierResolver = identifierResolver;
        this.chatMapper = chatMapper;
    }
    async resolve(client, params) {
        if (params.mode !== 'thread' && params.mode !== 'chatRange') {
            throw new BadRequestException('Неподдерживаемый режим синхронизации обсуждения');
        }
        const resolution = await this.identifierResolver.resolve(client, params.identifier);
        const resolvedChat = this.chatMapper.resolveChat(resolution.entity);
        if (!resolvedChat) {
            throw new BadRequestException('Resolved Telegram entity is not a supported chat type');
        }
        const messageId = params.messageId ?? resolution.identifier.messageId;
        if (params.mode === 'thread' && !messageId) {
            throw new BadRequestException('Для режима одного треда требуется messageId, если его нельзя извлечь из ссылки');
        }
        return {
            identifier: resolution.identifier,
            resolvedChat,
            mode: params.mode,
            messageId,
        };
    }
};
TelegramDiscussionResolverService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TelegramIdentifierResolverService,
        TelegramChatMapper])
], TelegramDiscussionResolverService);
export { TelegramDiscussionResolverService };
//# sourceMappingURL=telegram-discussion-resolver.service.js.map