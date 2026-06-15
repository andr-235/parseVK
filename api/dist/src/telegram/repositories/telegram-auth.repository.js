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
let TelegramAuthRepository = class TelegramAuthRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findLatestSettings() {
        return this.prisma.telegramSettings.findFirst({
            orderBy: { updatedAt: 'desc' },
        });
    }
    async upsertSettings(data) {
        const existing = (await this.prisma.telegramSettings.findFirst({
            orderBy: { updatedAt: 'desc' },
            select: { id: true },
        }));
        if (existing) {
            return this.prisma.telegramSettings.update({
                where: { id: existing.id },
                data: {
                    phoneNumber: data.phoneNumber ?? undefined,
                    apiId: data.apiId ?? undefined,
                    apiHash: data.apiHash ?? undefined,
                },
            });
        }
        return this.prisma.telegramSettings.create({
            data: {
                phoneNumber: data.phoneNumber ?? null,
                apiId: data.apiId ?? null,
                apiHash: data.apiHash ?? null,
            },
        });
    }
    findLatestSession() {
        return this.prisma.telegramSession.findFirst({
            orderBy: { updatedAt: 'desc' },
        });
    }
    async replaceSession(data) {
        await this.prisma.telegramSession.deleteMany({});
        await this.prisma.telegramSession.create({
            data: {
                session: data.session,
                userId: data.userId,
                username: data.username,
                phoneNumber: data.phoneNumber,
            },
        });
    }
    async deleteAllSessions() {
        const deleted = (await this.prisma.telegramSession.deleteMany({}));
        return deleted.count ?? 0;
    }
};
TelegramAuthRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], TelegramAuthRepository);
export { TelegramAuthRepository };
//# sourceMappingURL=telegram-auth.repository.js.map