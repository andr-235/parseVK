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
import bigInt from 'big-integer';
import { Api } from 'telegram';
import { TelegramChatType as PrismaTelegramChatType } from '../../generated/prisma/enums.js';
import { TelegramChatRepository } from '../repositories/telegram-chat.repository.js';
import { normalizeTelegramIdentifier } from '../utils/normalize-telegram-identifier.util.js';
let TelegramIdentifierResolverService = class TelegramIdentifierResolverService {
    chatRepository;
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }
    async resolve(client, rawIdentifier) {
        const identifier = normalizeTelegramIdentifier(rawIdentifier);
        if (identifier.kind === 'invalid') {
            throw new BadRequestException('Неподдерживаемый формат идентификатора Telegram');
        }
        if (identifier.kind === 'inviteLink') {
            throw new BadRequestException('Invite-ссылки требуют явного сценария вступления в чат');
        }
        if (identifier.kind === 'username' || identifier.kind === 'publicLink') {
            return {
                identifier,
                entity: await client.getEntity(identifier.username ?? identifier.normalized),
            };
        }
        return this.resolveByNumericId(client, identifier);
    }
    async resolveByNumericId(client, identifier) {
        const telegramId = identifier.numericTelegramId;
        if (!telegramId) {
            throw new BadRequestException('Идентификатор Telegram не содержит числовой идентификатор чата');
        }
        const directEntity = await this.tryResolveDirectlyByNumericId(client, identifier.normalized);
        if (directEntity) {
            return {
                identifier,
                entity: directEntity,
            };
        }
        const metadata = await this.chatRepository.findResolutionMetadataByTelegramId(telegramId);
        if (!metadata) {
            throw new BadRequestException('Нельзя выполнить первый sync только по внутреннему Telegram ID. Сначала используйте @username, публичную или invite-ссылку. После первого успешного sync внутренние идентификаторы вроде -100... и t.me/c/... будут работать.');
        }
        if (metadata.username) {
            return {
                identifier,
                entity: await client.getEntity(metadata.username),
            };
        }
        if ((metadata.type === PrismaTelegramChatType.CHANNEL ||
            metadata.type === PrismaTelegramChatType.SUPERGROUP) &&
            metadata.accessHash) {
            const response = await client.invoke(new Api.channels.GetChannels({
                id: [
                    new Api.InputChannel({
                        channelId: bigInt(telegramId.toString()),
                        accessHash: bigInt(metadata.accessHash),
                    }),
                ],
            }));
            if ('chats' in response && response.chats.length > 0) {
                return {
                    identifier,
                    entity: response.chats[0],
                };
            }
        }
        throw new BadRequestException('Не удалось открыть чат Telegram по числовому ID без сохранённого access hash');
    }
    async tryResolveDirectlyByNumericId(client, normalizedIdentifier) {
        try {
            const inputPeer = await client.getInputEntity(normalizedIdentifier);
            return (await client.getEntity(inputPeer));
        }
        catch {
            return null;
        }
    }
};
TelegramIdentifierResolverService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TelegramChatRepository])
], TelegramIdentifierResolverService);
export { TelegramIdentifierResolverService };
//# sourceMappingURL=telegram-identifier-resolver.service.js.map