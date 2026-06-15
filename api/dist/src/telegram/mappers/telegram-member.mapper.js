var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { Api } from 'telegram';
import { Prisma } from '../../generated/prisma/client.js';
import bigInt from 'big-integer';
import { TelegramMemberStatus } from '../types/telegram.enums.js';
let TelegramMemberMapper = class TelegramMemberMapper {
    mapChannelParticipantStatus(participant) {
        if (participant instanceof Api.ChannelParticipantCreator) {
            return {
                status: TelegramMemberStatus.CREATOR,
                isAdmin: true,
                isOwner: true,
                joinedAt: null,
                leftAt: null,
            };
        }
        if (participant instanceof Api.ChannelParticipantAdmin) {
            return {
                status: TelegramMemberStatus.ADMINISTRATOR,
                isAdmin: true,
                isOwner: false,
                joinedAt: this.extractDate(participant.date),
                leftAt: null,
            };
        }
        if (participant instanceof Api.ChannelParticipantBanned) {
            const status = participant.left
                ? TelegramMemberStatus.LEFT
                : TelegramMemberStatus.RESTRICTED;
            return {
                status,
                isAdmin: false,
                isOwner: false,
                joinedAt: this.extractDate(participant.date),
                leftAt: this.extractDate(participant
                    .bannedRights?.untilDate),
            };
        }
        if (participant instanceof Api.ChannelParticipantLeft) {
            return {
                status: TelegramMemberStatus.LEFT,
                isAdmin: false,
                isOwner: false,
                joinedAt: null,
                leftAt: null,
            };
        }
        return {
            status: TelegramMemberStatus.MEMBER,
            isAdmin: false,
            isOwner: false,
            joinedAt: this.extractDate(participant.date),
            leftAt: null,
        };
    }
    mapChatParticipantStatus(participant) {
        if (participant instanceof Api.ChatParticipantCreator) {
            return {
                status: TelegramMemberStatus.CREATOR,
                isAdmin: true,
                isOwner: true,
                joinedAt: null,
                leftAt: null,
            };
        }
        if (participant instanceof Api.ChatParticipantAdmin) {
            return {
                status: TelegramMemberStatus.ADMINISTRATOR,
                isAdmin: true,
                isOwner: false,
                joinedAt: this.extractDate(participant.date),
                leftAt: null,
            };
        }
        return {
            status: TelegramMemberStatus.MEMBER,
            isAdmin: false,
            isOwner: false,
            joinedAt: this.extractDate(participant.date),
            leftAt: null,
        };
    }
    buildMemberRecordFromChannel(user, participant) {
        const meta = this.mapChannelParticipantStatus(participant);
        return {
            user,
            status: meta.status,
            isAdmin: meta.isAdmin,
            isOwner: meta.isOwner,
            joinedAt: meta.joinedAt,
            leftAt: meta.leftAt,
        };
    }
    buildMemberRecordFromChat(user, participant) {
        const meta = this.mapChatParticipantStatus(participant);
        return {
            user,
            status: meta.status,
            isAdmin: meta.isAdmin,
            isOwner: meta.isOwner,
            joinedAt: meta.joinedAt,
            leftAt: meta.leftAt,
        };
    }
    buildTelegramUserData(user) {
        const photo = user.photo instanceof Api.UserProfilePhoto ? user.photo : null;
        const usernames = user.usernames?.length
            ? user.usernames.map((u) => ({
                username: u.username,
                active: u.active,
                editable: u.editable,
            }))
            : null;
        return {
            telegramId: this.toBigInt(user.id),
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            username: user.username ?? null,
            phoneNumber: user.phone ?? null,
            bio: null,
            languageCode: user.langCode ?? null,
            isBot: Boolean(user.bot),
            isPremium: Boolean(user.premium),
            deleted: Boolean(user.deleted),
            restricted: Boolean(user.restricted),
            verified: Boolean(user.verified),
            scam: Boolean(user.scam),
            fake: Boolean(user.fake),
            min: Boolean(user.min),
            self: Boolean(user.self),
            contact: Boolean(user.contact),
            mutualContact: Boolean(user.mutualContact),
            accessHash: user.accessHash ? user.accessHash.toString() : null,
            photoId: photo ? this.toBigInt(photo.photoId) : null,
            photoDcId: photo ? photo.dcId : null,
            photoHasVideo: photo ? Boolean(photo.hasVideo) : false,
            commonChatsCount: 'commonChatsCount' in user && typeof user.commonChatsCount === 'number'
                ? user.commonChatsCount
                : null,
            usernames: usernames
                ? JSON.parse(JSON.stringify(usernames))
                : Prisma.JsonNull,
            personal: Prisma.JsonNull,
            botInfo: Prisma.JsonNull,
            blocked: false,
            contactRequirePremium: false,
            spam: false,
            closeFriend: false,
        };
    }
    mapToMemberDto(userRecord, member) {
        const usernames = userRecord.usernames &&
            typeof userRecord.usernames === 'object' &&
            Array.isArray(userRecord.usernames)
            ? userRecord.usernames
            : null;
        return {
            userId: userRecord.id,
            telegramId: userRecord.telegramId.toString(),
            firstName: userRecord.firstName,
            lastName: userRecord.lastName,
            username: userRecord.username,
            phoneNumber: userRecord.phoneNumber,
            bio: userRecord.bio,
            languageCode: userRecord
                .languageCode,
            isBot: userRecord.isBot,
            isPremium: userRecord.isPremium,
            deleted: userRecord.deleted,
            restricted: userRecord.restricted,
            verified: userRecord.verified,
            scam: userRecord.scam,
            fake: userRecord.fake,
            min: userRecord.min,
            self: userRecord.self,
            contact: userRecord.contact,
            mutualContact: userRecord.mutualContact,
            accessHash: userRecord.accessHash,
            photoId: userRecord.photoId
                ? userRecord.photoId.toString()
                : null,
            photoDcId: userRecord.photoDcId,
            photoHasVideo: userRecord.photoHasVideo,
            commonChatsCount: userRecord
                .commonChatsCount,
            usernames,
            personal: userRecord.personal &&
                typeof userRecord.personal === 'object'
                ? userRecord
                    .personal
                : null,
            botInfo: userRecord.botInfo &&
                typeof userRecord.botInfo === 'object'
                ? userRecord
                    .botInfo
                : null,
            blocked: userRecord.blocked,
            contactRequirePremium: userRecord
                .contactRequirePremium,
            spam: userRecord.spam,
            closeFriend: userRecord.closeFriend,
            status: member.status,
            isAdmin: member.isAdmin,
            isOwner: member.isOwner,
            joinedAt: member.joinedAt
                ? member.joinedAt.toISOString()
                : null,
            leftAt: member.leftAt
                ? member.leftAt.toISOString()
                : null,
        };
    }
    formatMemberStatus(status) {
        const statusMap = {
            CREATOR: 'Создатель',
            ADMINISTRATOR: 'Администратор',
            MEMBER: 'Участник',
            RESTRICTED: 'Ограничен',
            LEFT: 'Покинул',
            KICKED: 'Исключен',
        };
        return statusMap[status] ?? status;
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
    extractDate(value) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return new Date(value * 1000);
        }
        if (typeof value === 'bigint') {
            return new Date(Number(value) * 1000);
        }
        if (value && typeof value === 'object') {
            try {
                const parsed = this.toBigInt(value);
                return new Date(Number(parsed) * 1000);
            }
            catch {
                return null;
            }
        }
        return null;
    }
    toTelegramLong(value) {
        if (value === undefined || value === null) {
            return bigInt.zero;
        }
        try {
            return bigInt(this.toBigInt(value).toString());
        }
        catch {
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (/^-?\d+$/.test(trimmed)) {
                    return bigInt(trimmed);
                }
            }
            return bigInt.zero;
        }
    }
    bigIntKey(value) {
        return this.toBigInt(value).toString();
    }
};
TelegramMemberMapper = __decorate([
    Injectable()
], TelegramMemberMapper);
export { TelegramMemberMapper };
//# sourceMappingURL=telegram-member.mapper.js.map