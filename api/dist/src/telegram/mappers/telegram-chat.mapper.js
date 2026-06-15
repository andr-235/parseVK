var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { Api } from 'telegram';
import { TelegramChatType } from '../types/telegram.enums.js';
let TelegramChatMapper = class TelegramChatMapper {
    resolveChat(entity) {
        if (entity instanceof Api.Channel) {
            const type = entity.megagroup
                ? TelegramChatType.SUPERGROUP
                : TelegramChatType.CHANNEL;
            return {
                telegramId: this.toBigInt(entity.id),
                type,
                title: entity.title ?? null,
                username: entity.username ?? null,
                description: null,
                accessHash: typeof entity.accessHash === 'bigint' ||
                    typeof entity.accessHash === 'number' ||
                    typeof entity.accessHash === 'string'
                    ? entity.accessHash.toString()
                    : null,
                entity,
                totalMembers: typeof entity
                    .participantsCount === 'number'
                    ? entity.participantsCount
                    : null,
            };
        }
        if (entity instanceof Api.Chat) {
            return {
                telegramId: this.toBigInt(entity.id),
                type: TelegramChatType.GROUP,
                title: entity.title ?? null,
                username: null,
                description: null,
                accessHash: null,
                entity,
                totalMembers: typeof entity
                    .participantsCount === 'number'
                    ? entity.participantsCount
                    : null,
            };
        }
        if (entity instanceof Api.User) {
            return {
                telegramId: this.toBigInt(entity.id),
                type: TelegramChatType.PRIVATE,
                title: this.composeUserTitle(entity),
                username: entity.username ?? null,
                description: null,
                accessHash: null,
                entity,
                totalMembers: 1,
            };
        }
        return null;
    }
    composeUserTitle(user) {
        const parts = [user.firstName, user.lastName].filter((value) => Boolean(value && value.trim().length > 0));
        if (parts.length === 0) {
            return user.username ?? null;
        }
        return parts.join(' ').trim();
    }
    toBigInt(value) {
        if (typeof value === 'bigint') {
            return value;
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            return BigInt(Math.trunc(value));
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (/^-?\d+$/.test(trimmed)) {
                return BigInt(trimmed);
            }
        }
        if (value &&
            typeof value.toString === 'function') {
            const stringValue = value.toString();
            if (/^-?\d+$/.test(stringValue)) {
                return BigInt(stringValue);
            }
        }
        throw new Error('Unable to convert value to bigint');
    }
};
TelegramChatMapper = __decorate([
    Injectable()
], TelegramChatMapper);
export { TelegramChatMapper };
//# sourceMappingURL=telegram-chat.mapper.js.map