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
const DEFAULT_SETTINGS = {
    enabled: false,
    runHour: 3,
    runMinute: 0,
    postLimit: 10,
    timezoneOffsetMinutes: 0,
};
let TaskAutomationRepository = class TaskAutomationRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureSettingsExists() {
        const existing = await this.prisma.taskAutomationSettings.findFirst();
        if (existing) {
            return;
        }
        await this.prisma.taskAutomationSettings.create({
            data: { ...DEFAULT_SETTINGS },
        });
    }
    async getOrCreateSettings() {
        const settings = await this.prisma.taskAutomationSettings.findFirst();
        if (settings) {
            return settings;
        }
        return this.prisma.taskAutomationSettings.create({
            data: { ...DEFAULT_SETTINGS },
        });
    }
    updateSettings(id, data) {
        return this.prisma.taskAutomationSettings.update({
            where: { id },
            data,
        });
    }
    async updateLastRunAt(id, date) {
        await this.prisma.taskAutomationSettings.update({
            where: { id },
            data: { lastRunAt: date },
        });
    }
    async hasActiveTasks() {
        const count = await this.prisma.task.count({
            where: {
                OR: [
                    { status: { in: ['pending', 'running'] } },
                    {
                        AND: [
                            { completed: { equals: false } },
                            { status: { notIn: ['done', 'failed'] } },
                        ],
                    },
                ],
            },
        });
        return count > 0;
    }
    findLastCompletedTask() {
        return this.prisma.task.findFirst({
            where: {
                completed: true,
                status: 'done',
            },
            orderBy: { updatedAt: 'desc' },
            select: { description: true },
        });
    }
};
TaskAutomationRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], TaskAutomationRepository);
export { TaskAutomationRepository };
//# sourceMappingURL=task-automation.repository.js.map