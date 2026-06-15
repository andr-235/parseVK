var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MonitoringGroupsService_1;
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { MonitorDatabaseService } from './monitor-database.service.js';
import { MonitoringMessenger } from './types/monitoring-messenger.enum.js';
const normalizeRequiredString = (value) => value.trim();
const normalizeOptionalString = (value) => {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};
const normalizeFilter = (value) => {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};
let MonitoringGroupsService = MonitoringGroupsService_1 = class MonitoringGroupsService {
    prisma;
    monitorDb;
    logger = new Logger(MonitoringGroupsService_1.name);
    constructor(prisma, monitorDb) {
        this.prisma = prisma;
        this.monitorDb = monitorDb;
    }
    get monitoringGroup() {
        return this.prisma.monitoringGroup;
    }
    async getGroups(options) {
        if (options?.sync) {
            if (!options.messenger) {
                this.logger.warn('Синхронизация групп пропущена: messenger не указан.');
            }
            else if (options.messenger === MonitoringMessenger.whatsapp ||
                options.messenger === MonitoringMessenger.max) {
                this.logger.log(`Запрос синхронизации групп: messenger=${options.messenger}`);
                await this.syncExternalGroups(options.messenger);
            }
            else {
                this.logger.warn('Синхронизация групп пропущена: messenger не поддерживается.');
            }
        }
        const search = normalizeFilter(options?.search);
        const category = normalizeFilter(options?.category);
        const where = {
            ...(options?.messenger ? { messenger: options.messenger } : {}),
            ...(category
                ? {
                    category: {
                        equals: category,
                        mode: 'insensitive',
                    },
                }
                : {}),
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { chatId: { contains: search, mode: 'insensitive' } },
                        { category: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.monitoringGroup.findMany({
                where,
                orderBy: { name: 'asc' },
            }),
            this.monitoringGroup.count({ where }),
        ]);
        return { items, total };
    }
    createGroup(dto) {
        const chatId = normalizeRequiredString(dto.chatId);
        const name = normalizeRequiredString(dto.name);
        const category = normalizeOptionalString(dto.category) ?? null;
        return this.monitoringGroup.upsert({
            where: {
                messenger_chatId: {
                    messenger: dto.messenger,
                    chatId,
                },
            },
            create: {
                messenger: dto.messenger,
                chatId,
                name,
                category,
            },
            update: {
                name,
                category,
            },
        });
    }
    updateGroup(id, dto) {
        const data = {};
        if (dto.chatId !== undefined) {
            data.chatId = normalizeRequiredString(dto.chatId);
        }
        if (dto.name !== undefined) {
            data.name = normalizeRequiredString(dto.name);
        }
        if (dto.category !== undefined) {
            data.category = normalizeOptionalString(dto.category);
        }
        if (dto.messenger !== undefined) {
            data.messenger = dto.messenger;
        }
        if (Object.keys(data).length === 0) {
            throw new BadRequestException('Нет данных для обновления группы.');
        }
        return this.monitoringGroup.update({
            where: { id },
            data,
        });
    }
    async deleteGroup(id) {
        await this.monitoringGroup.delete({ where: { id } });
        return { success: true, id };
    }
    async syncExternalGroups(messenger) {
        if (!this.monitorDb.isReady) {
            this.logger.warn(`Синхронизация групп пропущена: мониторинг БД не готов (messenger=${messenger}).`);
            return;
        }
        try {
            const sources = messenger === MonitoringMessenger.whatsapp
                ? ['messages']
                : messenger === MonitoringMessenger.max
                    ? ['messages_max']
                    : undefined;
            const sourcesLabel = sources?.join(',') ?? 'auto';
            this.logger.log(`Синхронизация групп: messenger=${messenger}, sources=${sourcesLabel}`);
            const groups = await this.monitorDb.findGroups({ sources });
            if (!groups || groups.length === 0) {
                this.logger.warn(`Синхронизация групп: внешние группы не найдены (messenger=${messenger}).`);
                return;
            }
            this.logger.log(`Синхронизация групп: найдено ${groups.length} записей (messenger=${messenger}).`);
            let synced = 0;
            for (const group of groups) {
                const chatId = normalizeRequiredString(group.chatId);
                const name = normalizeRequiredString(group.name);
                await this.monitoringGroup.upsert({
                    where: {
                        messenger_chatId: {
                            messenger,
                            chatId,
                        },
                    },
                    create: {
                        messenger,
                        chatId,
                        name,
                        category: null,
                    },
                    update: {
                        name,
                    },
                });
                synced += 1;
            }
            this.logger.log(`Синхронизация групп завершена: сохранено=${synced} (messenger=${messenger}).`);
        }
        catch (error) {
            this.logger.warn('Не удалось синхронизировать группы из внешней базы мониторинга.');
            this.logger.debug(error instanceof Error ? error.stack : String(error));
        }
    }
};
MonitoringGroupsService = MonitoringGroupsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        MonitorDatabaseService])
], MonitoringGroupsService);
export { MonitoringGroupsService };
//# sourceMappingURL=monitoring-groups.service.js.map