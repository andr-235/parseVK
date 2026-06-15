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
import { toCreateJsonValue } from '../../common/utils/prisma-json.utils.js';
const DEFAULT_BATCH_SIZE = 1000;
const MIN_BATCH_SIZE = 500;
const MAX_BATCH_SIZE = 1000;
let VkFriendsRepository = class VkFriendsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    createJob(input) {
        const status = input.status ?? 'PENDING';
        const fetchedCount = this.normalizeCount(input.fetchedCount ?? 0);
        return this.prisma.exportJob.create({
            data: {
                status,
                params: toCreateJsonValue(input.params),
                vkUserId: input.vkUserId ?? null,
                totalCount: input.totalCount ?? null,
                fetchedCount,
                warning: input.warning ?? null,
                error: input.error ?? null,
                xlsxPath: input.xlsxPath ?? null,
                docxPath: input.docxPath ?? null,
            },
        });
    }
    getJobById(jobId) {
        return this.prisma.exportJob.findUnique({
            where: { id: jobId },
        });
    }
    getJobLogs(jobId, take = 200) {
        const normalizedTake = this.normalizeTake(take);
        if (normalizedTake === 0) {
            return Promise.resolve([]);
        }
        return this.prisma.jobLog.findMany({
            where: { jobId },
            orderBy: { createdAt: 'desc' },
            take: normalizedTake,
        });
    }
    async appendLogs(jobId, logs) {
        if (!logs.length) {
            return 0;
        }
        const data = logs.map((log) => ({
            jobId,
            level: log.level,
            message: log.message,
            ...(log.meta !== undefined && { meta: toCreateJsonValue(log.meta) }),
        }));
        const result = await this.prisma.jobLog.createMany({
            data,
        });
        return result.count;
    }
    setJobProgress(jobId, input) {
        const fetchedCount = this.normalizeCount(input.fetchedCount);
        const status = input.status ?? 'RUNNING';
        const data = {
            fetchedCount,
            status,
            ...(input.totalCount !== undefined && { totalCount: input.totalCount }),
            ...(input.warning !== undefined && { warning: input.warning }),
        };
        return this.prisma.exportJob.update({
            where: { id: jobId },
            data,
        });
    }
    completeJob(jobId, input) {
        const fetchedCount = this.normalizeCount(input.fetchedCount);
        const data = {
            status: 'DONE',
            fetchedCount,
            ...(input.totalCount !== undefined && { totalCount: input.totalCount }),
            ...(input.warning !== undefined && { warning: input.warning }),
            ...(input.xlsxPath !== undefined && { xlsxPath: input.xlsxPath }),
            ...(input.docxPath !== undefined && { docxPath: input.docxPath }),
        };
        return this.prisma.exportJob.update({
            where: { id: jobId },
            data,
        });
    }
    failJob(jobId, input) {
        const data = {
            status: 'FAILED',
            error: input.error,
            ...(input.fetchedCount !== undefined && {
                fetchedCount: this.normalizeCount(input.fetchedCount),
            }),
            ...(input.totalCount !== undefined && { totalCount: input.totalCount }),
            ...(input.warning !== undefined && { warning: input.warning }),
        };
        return this.prisma.exportJob.update({
            where: { id: jobId },
            data,
        });
    }
    async saveFriendsBatch(jobId, records, batchSize = DEFAULT_BATCH_SIZE) {
        if (!records.length) {
            return 0;
        }
        const normalizedBatchSize = this.normalizeBatchSize(batchSize);
        let inserted = 0;
        for (let i = 0; i < records.length; i += normalizedBatchSize) {
            const chunk = records.slice(i, i + normalizedBatchSize);
            const data = chunk.map((record) => ({
                jobId,
                vkFriendId: record.vkFriendId,
                payload: toCreateJsonValue(record.payload),
            }));
            const result = await this.prisma.friendRecord.createMany({
                data,
            });
            inserted += result.count;
        }
        return inserted;
    }
    getFriendRecordPayloads(jobId) {
        return this.prisma.friendRecord.findMany({
            where: { jobId },
            orderBy: { createdAt: 'asc' },
            select: { payload: true },
        });
    }
    normalizeBatchSize(batchSize) {
        if (!Number.isFinite(batchSize)) {
            return DEFAULT_BATCH_SIZE;
        }
        const normalized = Math.floor(batchSize);
        if (normalized <= 0) {
            return DEFAULT_BATCH_SIZE;
        }
        return Math.min(Math.max(normalized, MIN_BATCH_SIZE), MAX_BATCH_SIZE);
    }
    normalizeCount(value) {
        if (!Number.isFinite(value)) {
            return 0;
        }
        return Math.max(0, Math.floor(value));
    }
    normalizeTake(value) {
        if (!Number.isFinite(value)) {
            return 0;
        }
        return Math.max(0, Math.floor(value));
    }
};
VkFriendsRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], VkFriendsRepository);
export { VkFriendsRepository };
//# sourceMappingURL=vk-friends.repository.js.map