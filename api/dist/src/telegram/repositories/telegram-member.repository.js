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
let TelegramMemberRepository = class TelegramMemberRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    upsertUser(telegramId, data) {
        return this.prisma.telegramUser.upsert({
            where: { telegramId },
            create: data,
            update: data,
        });
    }
    upsertChatMember(data) {
        return this.prisma.telegramChatMember.upsert({
            where: {
                chatId_userId: {
                    chatId: data.chatId,
                    userId: data.userId,
                },
            },
            create: data,
            update: {
                status: data.status,
                isAdmin: data.isAdmin,
                isOwner: data.isOwner,
                joinedAt: data.joinedAt,
                leftAt: data.leftAt,
            },
        });
    }
};
TelegramMemberRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], TelegramMemberRepository);
export { TelegramMemberRepository };
//# sourceMappingURL=telegram-member.repository.js.map