import { PrismaService } from '../../prisma.service.js';
import { TelegramChatType } from '../../generated/prisma/client.js';
export interface TelegramChatCreateData {
    telegramId: bigint;
    type: TelegramChatType;
    title: string | null;
    username: string | null;
    description: string | null;
    accessHash?: string | null;
}
export interface TelegramChatUpdateData {
    type?: TelegramChatType;
    title?: string | null;
    username?: string | null;
    description?: string | null;
    accessHash?: string | null;
}
export declare class TelegramChatRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: number): import("../../generated/prisma/models.js").Prisma__TelegramChatClient<({
        members: ({
            user: {
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
            };
        } & {
            id: number;
            status: import("../../generated/prisma/enums.js").TelegramMemberStatus;
            chatId: number;
            userId: number;
            isAdmin: boolean;
            isOwner: boolean;
            joinedAt: Date | null;
            leftAt: Date | null;
            importedAt: Date;
            rawPayload: import("@prisma/client/runtime/client.js").JsonValue | null;
        })[];
    } & {
        id: number;
        title: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        username: string | null;
        type: TelegramChatType;
        photoUrl: string | null;
        telegramId: bigint;
        accessHash: string | null;
    }) | null, null, import("@prisma/client/runtime/client.js").DefaultArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace.js").GlobalOmitConfig | undefined;
    }>;
    findByTelegramId(telegramId: bigint): import("../../generated/prisma/models.js").Prisma__TelegramChatClient<{
        id: number;
        title: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        username: string | null;
        type: TelegramChatType;
        photoUrl: string | null;
        telegramId: bigint;
        accessHash: string | null;
    } | null, null, import("@prisma/client/runtime/client.js").DefaultArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace.js").GlobalOmitConfig | undefined;
    }>;
    findResolutionMetadataByTelegramId(telegramId: bigint): import("../../generated/prisma/models.js").Prisma__TelegramChatClient<{
        username: string | null;
        type: TelegramChatType;
        telegramId: bigint;
        accessHash: string | null;
    } | null, null, import("@prisma/client/runtime/client.js").DefaultArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace.js").GlobalOmitConfig | undefined;
    }>;
    upsert(telegramId: bigint, create: TelegramChatCreateData, update: TelegramChatUpdateData): import("../../generated/prisma/models.js").Prisma__TelegramChatClient<{
        id: number;
        title: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        username: string | null;
        type: TelegramChatType;
        photoUrl: string | null;
        telegramId: bigint;
        accessHash: string | null;
    }, never, import("@prisma/client/runtime/client.js").DefaultArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace.js").GlobalOmitConfig | undefined;
    }>;
}
