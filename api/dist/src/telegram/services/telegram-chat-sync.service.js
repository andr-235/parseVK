var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramChatSyncService_1;
import { Injectable, Logger } from '@nestjs/common';
import { Api } from 'telegram';
import { TelegramChatRepository } from '../repositories/telegram-chat.repository.js';
import { TelegramMemberRepository } from '../repositories/telegram-member.repository.js';
import { TelegramMemberMapper, } from '../mappers/telegram-member.mapper.js';
import { PrismaService } from '../../prisma.service.js';
let TelegramChatSyncService = TelegramChatSyncService_1 = class TelegramChatSyncService {
    chatRepository;
    memberRepository;
    memberMapper;
    prisma;
    logger = new Logger(TelegramChatSyncService_1.name);
    constructor(chatRepository, memberRepository, memberMapper, prisma) {
        this.chatRepository = chatRepository;
        this.memberRepository = memberRepository;
        this.memberMapper = memberMapper;
        this.prisma = prisma;
    }
    persistChat(resolved, members, client, enrichWithFullData = false) {
        return this.prisma.$transaction(async (tx) => {
            const chat = (await tx.telegramChat.upsert({
                where: { telegramId: resolved.telegramId },
                select: { id: true, telegramId: true },
                create: {
                    telegramId: resolved.telegramId,
                    type: resolved.type,
                    title: resolved.title,
                    username: resolved.username,
                    description: resolved.description,
                    accessHash: resolved.accessHash,
                },
                update: {
                    type: resolved.type,
                    title: resolved.title,
                    username: resolved.username,
                    description: resolved.description,
                    accessHash: resolved.accessHash,
                },
            }));
            const membersPayload = [];
            for (const member of members) {
                let userData = this.memberMapper.buildTelegramUserData(member.user);
                if (enrichWithFullData) {
                    const fullData = await this.enrichUserWithFullData(client, member.user);
                    userData = {
                        ...userData,
                        ...fullData,
                        personal: fullData.personal !== undefined
                            ? fullData.personal
                            : userData.personal,
                        botInfo: fullData.botInfo !== undefined
                            ? fullData.botInfo
                            : userData.botInfo,
                    };
                }
                const userRecord = (await tx.telegramUser.upsert({
                    where: { telegramId: this.memberMapper.toBigInt(member.user.id) },
                    create: userData,
                    update: userData,
                }));
                const joinedAt = member.joinedAt ?? null;
                const leftAt = member.leftAt ?? null;
                const memberRecordResult = await tx.telegramChatMember.upsert({
                    where: {
                        chatId_userId: {
                            chatId: chat.id,
                            userId: userRecord.id,
                        },
                    },
                    create: {
                        chatId: chat.id,
                        userId: userRecord.id,
                        status: member.status,
                        isAdmin: member.isAdmin,
                        isOwner: member.isOwner,
                        joinedAt,
                        leftAt,
                    },
                    update: {
                        status: member.status,
                        isAdmin: member.isAdmin,
                        isOwner: member.isOwner,
                        joinedAt,
                        leftAt,
                    },
                });
                const typedUserRecord = userRecord;
                const typedMemberRecord = {
                    status: memberRecordResult
                        .status,
                    isAdmin: memberRecordResult
                        .isAdmin,
                    isOwner: memberRecordResult
                        .isOwner,
                    joinedAt: memberRecordResult
                        .joinedAt,
                    leftAt: memberRecordResult
                        .leftAt,
                };
                membersPayload.push(this.memberMapper.mapToMemberDto(typedUserRecord, typedMemberRecord));
            }
            return {
                chatId: chat.id,
                telegramId: chat.telegramId,
                members: membersPayload,
            };
        });
    }
    async enrichUserWithFullData(client, user) {
        try {
            const fullUser = await client.invoke(new Api.users.GetFullUser({ id: user.id }));
            if (!(fullUser.fullUser instanceof Api.UserFull)) {
                return {};
            }
            const full = fullUser.fullUser;
            const personal = 'personal' in full &&
                full.personal &&
                typeof full.personal === 'object' &&
                full.personal !== null
                ? {
                    flags: 'flags' in full.personal
                        ? full.personal.flags
                        : undefined,
                    phoneNumber: 'phoneNumber' in full.personal
                        ? full.personal.phoneNumber
                        : undefined,
                    email: 'email' in full.personal
                        ? full.personal.email
                        : undefined,
                    firstName: 'firstName' in full.personal
                        ? full.personal.firstName
                        : undefined,
                    lastName: 'lastName' in full.personal
                        ? full.personal.lastName
                        : undefined,
                    birthday: 'birthday' in full.personal
                        ? full.personal.birthday
                        : undefined,
                    country: 'country' in full.personal
                        ? full.personal.country
                        : undefined,
                    countryCode: 'countryCode' in full.personal
                        ? full.personal.countryCode
                        : undefined,
                    about: 'about' in full.personal
                        ? full.personal.about
                        : undefined,
                }
                : null;
            const botInfo = full.botInfo
                ? {
                    userId: full.botInfo.userId?.toString(),
                    description: full.botInfo.description,
                    descriptionPhoto: full.botInfo.descriptionPhoto &&
                        !(full.botInfo.descriptionPhoto instanceof Api.PhotoEmpty)
                        ? {
                            photoId: 'photoId' in full.botInfo.descriptionPhoto
                                ? full.botInfo.descriptionPhoto.photoId?.toString()
                                : undefined,
                            dcId: 'dcId' in full.botInfo.descriptionPhoto
                                ? full.botInfo.descriptionPhoto.dcId
                                : undefined,
                        }
                        : null,
                    descriptionDocument: full.botInfo.descriptionDocument &&
                        !(full.botInfo.descriptionDocument instanceof Api.DocumentEmpty)
                        ? {
                            id: 'id' in full.botInfo.descriptionDocument
                                ? full.botInfo.descriptionDocument.id?.toString()
                                : undefined,
                            accessHash: 'accessHash' in full.botInfo.descriptionDocument
                                ? full.botInfo.descriptionDocument.accessHash?.toString()
                                : undefined,
                        }
                        : null,
                    commands: full.botInfo.commands?.map((cmd) => ({
                        command: cmd.command,
                        description: cmd.description,
                    })) || null,
                    menuButton: full.botInfo.menuButton
                        ? {
                            type: full.botInfo.menuButton.className,
                        }
                        : null,
                }
                : null;
            const result = {
                bio: full.about ?? null,
                blocked: Boolean('blocked' in full && full.blocked),
                contactRequirePremium: Boolean('contactRequirePremium' in full && full.contactRequirePremium),
                spam: Boolean('spam' in full && full.spam),
                closeFriend: Boolean('closeFriend' in full && full.closeFriend),
            };
            if (personal) {
                result.personal = JSON.parse(JSON.stringify(personal));
            }
            if (botInfo) {
                result.botInfo = JSON.parse(JSON.stringify(botInfo));
            }
            return result;
        }
        catch (err) {
            const userid = user.id;
            const userId = typeof userid === 'bigint' ? userid.toString() : String(userid);
            const errorMessage = err instanceof Error
                ? `${err.name}: ${err.message}`
                : typeof err === 'string'
                    ? err
                    : String(err);
            this.logger.warn(`Failed to get full user data for ${userId}: ${errorMessage}`);
            return {};
        }
    }
    stringifyError(error) {
        if (error instanceof Error) {
            return `${error.name}: ${error.message}`;
        }
        if (typeof error === 'string') {
            return error;
        }
        try {
            return JSON.stringify(error);
        }
        catch {
            return String(error);
        }
    }
};
TelegramChatSyncService = TelegramChatSyncService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TelegramChatRepository,
        TelegramMemberRepository,
        TelegramMemberMapper,
        PrismaService])
], TelegramChatSyncService);
export { TelegramChatSyncService };
//# sourceMappingURL=telegram-chat-sync.service.js.map