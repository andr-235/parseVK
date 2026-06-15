import { PrismaService } from '../../prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { TelegramMemberStatus } from '../../generated/prisma/client.js';
export interface TelegramUserCreateData {
    telegramId: bigint;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    phoneNumber: string | null;
    bio: string | null;
    languageCode: string | null;
    isBot: boolean;
    isPremium: boolean;
    deleted: boolean;
    restricted: boolean;
    verified: boolean;
    scam: boolean;
    fake: boolean;
    min: boolean;
    self: boolean;
    contact: boolean;
    mutualContact: boolean;
    accessHash: string | null;
    photoId: bigint | null;
    photoDcId: number | null;
    photoHasVideo: boolean;
    commonChatsCount: number | null;
    usernames: Prisma.InputJsonValue;
    personal: Prisma.InputJsonValue;
    botInfo: Prisma.InputJsonValue;
    blocked: boolean;
    contactRequirePremium: boolean;
    spam: boolean;
    closeFriend: boolean;
}
export interface TelegramChatMemberCreateData {
    chatId: number;
    userId: number;
    status: TelegramMemberStatus;
    isAdmin: boolean;
    isOwner: boolean;
    joinedAt: Date | null;
    leftAt: Date | null;
}
export declare class TelegramMemberRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsertUser(telegramId: bigint, data: TelegramUserCreateData): Prisma.Prisma__TelegramUserClient<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        username: string | null;
        verified: boolean;
        firstName: string | null;
        lastName: string | null;
        photoId: bigint | null;
        personal: import("@prisma/client/runtime/client.js").JsonValue | null;
        telegramId: bigint;
        accessHash: string | null;
        phoneNumber: string | null;
        bio: string | null;
        languageCode: string | null;
        isBot: boolean;
        isPremium: boolean;
        deleted: boolean;
        restricted: boolean;
        scam: boolean;
        fake: boolean;
        min: boolean;
        self: boolean;
        contact: boolean;
        mutualContact: boolean;
        photoDcId: number | null;
        photoHasVideo: boolean;
        commonChatsCount: number | null;
        usernames: import("@prisma/client/runtime/client.js").JsonValue | null;
        botInfo: import("@prisma/client/runtime/client.js").JsonValue | null;
        blocked: boolean;
        contactRequirePremium: boolean;
        spam: boolean;
        closeFriend: boolean;
    }, never, import("@prisma/client/runtime/client.js").DefaultArgs, {
        omit: Prisma.GlobalOmitConfig | undefined;
    }>;
    upsertChatMember(data: TelegramChatMemberCreateData): Prisma.Prisma__TelegramChatMemberClient<{
        id: number;
        status: TelegramMemberStatus;
        chatId: number;
        userId: number;
        isAdmin: boolean;
        isOwner: boolean;
        joinedAt: Date | null;
        leftAt: Date | null;
        importedAt: Date;
        rawPayload: import("@prisma/client/runtime/client.js").JsonValue | null;
    }, never, import("@prisma/client/runtime/client.js").DefaultArgs, {
        omit: Prisma.GlobalOmitConfig | undefined;
    }>;
}
