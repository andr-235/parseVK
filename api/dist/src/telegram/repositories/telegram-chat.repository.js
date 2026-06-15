var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
let TelegramChatRepository = class TelegramChatRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findById(id) {
        return this.prisma.telegramChat.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }
    findByTelegramId(telegramId) {
        return this.prisma.telegramChat.findUnique({
            where: { telegramId },
        });
    }
    findResolutionMetadataByTelegramId(telegramId) {
        return this.prisma.telegramChat.findUnique({
            where: { telegramId },
            select: {
                telegramId: true,
                type: true,
                username: true,
                accessHash: true,
            },
        });
    }
    upsert(telegramId, create, update) {
        return this.prisma.telegramChat.upsert({
            where: { telegramId },
            create,
            update,
        });
    }
};
TelegramChatRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], TelegramChatRepository);
export { TelegramChatRepository };
//# sourceMappingURL=telegram-chat.repository.js.map