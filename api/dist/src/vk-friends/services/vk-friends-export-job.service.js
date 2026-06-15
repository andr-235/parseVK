var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VkFriendsExportJobService_1;
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { FriendMapper } from '../mappers/friend.mapper.js';
import { VkFriendsExporterService } from './vk-friends-exporter.service.js';
import { FriendsJobStreamService } from '../../common/friends-export/services/friends-job-stream.service.js';
import { VkFriendsService } from '../vk-friends.service.js';
import { EXPORT_BATCH_SIZE } from '../vk-friends.constants.js';
let VkFriendsExportJobService = VkFriendsExportJobService_1 = class VkFriendsExportJobService {
    vkFriendsService;
    friendMapper;
    exporter;
    jobStream;
    logger = new Logger(VkFriendsExportJobService_1.name);
    constructor(vkFriendsService, friendMapper, exporter, jobStream) {
        this.vkFriendsService = vkFriendsService;
        this.friendMapper = friendMapper;
        this.exporter = exporter;
        this.jobStream = jobStream;
    }
    async run(jobId, params) {
        const progressState = {
            fetchedCount: 0,
            totalCount: 0,
            warning: undefined,
        };
        const log = async (level, message, meta) => {
            try {
                await this.vkFriendsService.appendLogs(jobId, [
                    { level, message, meta },
                ]);
            }
            catch (err) {
                this.logger.error(`Failed to append job log: ${message}`, err instanceof Error ? err.stack : String(err));
            }
            this.jobStream.emit(jobId, {
                type: 'log',
                data: { level, message, meta },
            });
        };
        const reportProgress = (payload) => {
            progressState.fetchedCount = payload.fetchedCount;
            progressState.totalCount = payload.totalCount;
            this.jobStream.emit(jobId, { type: 'progress', data: payload });
            void this.vkFriendsService
                .setJobProgress(jobId, {
                fetchedCount: payload.fetchedCount,
                totalCount: payload.totalCount,
            })
                .catch((err) => {
                this.logger.error('Failed to update job progress', err instanceof Error ? err.stack : String(err));
            });
        };
        try {
            await log('info', 'Export started');
            const { totalCount, fetchedCount, warning, rawItems } = await this.vkFriendsService.fetchAllFriends(params, {
                onProgress: reportProgress,
                onLog: (msg) => {
                    const level = msg.startsWith('VK limit:') ? 'warn' : 'info';
                    void log(level, msg);
                },
            });
            progressState.totalCount = totalCount;
            progressState.fetchedCount = fetchedCount;
            progressState.warning = warning;
            if (warning) {
                await this.vkFriendsService.setJobProgress(jobId, {
                    fetchedCount,
                    totalCount,
                    warning,
                });
            }
            await log('info', 'Fetch completed', { totalCount, fetchedCount });
            const { records, skipped } = this.buildFriendRecords(rawItems);
            if (skipped > 0) {
                await log('warn', `Skipped friends without id: ${skipped}`);
            }
            const inserted = await this.vkFriendsService.saveFriendsBatch(jobId, records, EXPORT_BATCH_SIZE);
            await log('info', `Saved friend records: ${inserted}`);
            const friendRows = rawItems.map((item) => this.friendMapper.mapVkUserToFlatDto(item));
            const xlsxPath = await this.exporter.writeXlsxFile(jobId, friendRows);
            const stats = await fs.stat(xlsxPath);
            if (!stats.isFile() || stats.size === 0) {
                throw new Error(`File verification failed: ${xlsxPath}`);
            }
            this.logger.debug(`XLSX file verified: ${xlsxPath}, size: ${stats.size} bytes`);
            await log('info', 'XLSX generated', { path: xlsxPath });
            const completedJob = await this.vkFriendsService.completeJob(jobId, {
                fetchedCount,
                totalCount,
                warning,
                xlsxPath,
            });
            await log('info', 'Export completed');
            this.emitDone(completedJob);
            this.jobStream.complete(jobId);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Export failed';
            await this.vkFriendsService
                .failJob(jobId, {
                error: errorMessage,
                fetchedCount: progressState.fetchedCount,
                totalCount: progressState.totalCount,
                warning: progressState.warning,
            })
                .catch((failErr) => {
                this.logger.error('Failed to mark job as failed', failErr instanceof Error ? failErr.stack : String(failErr));
            });
            await log('error', 'Export failed', { message: errorMessage });
            this.jobStream.emit(jobId, {
                type: 'error',
                data: { message: errorMessage },
            });
            this.jobStream.complete(jobId);
        }
    }
    emitDone(job) {
        this.jobStream.emit(job.id, {
            type: 'done',
            data: {
                jobId: job.id,
                status: job.status,
                fetchedCount: job.fetchedCount,
                totalCount: job.totalCount ?? undefined,
                warning: job.warning ?? undefined,
                xlsxPath: job.xlsxPath ?? undefined,
            },
        });
    }
    buildFriendRecords(rawItems) {
        const records = [];
        let skipped = 0;
        for (const item of rawItems) {
            const vkFriendId = this.extractFriendId(item);
            if (vkFriendId === null) {
                skipped += 1;
                continue;
            }
            records.push({ vkFriendId, payload: item });
        }
        return { records, skipped };
    }
    extractFriendId(value) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return Math.trunc(value);
        }
        if (value && typeof value === 'object') {
            const idVal = value.id;
            if (typeof idVal === 'number' && Number.isFinite(idVal)) {
                return Math.trunc(idVal);
            }
        }
        return null;
    }
};
VkFriendsExportJobService = VkFriendsExportJobService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [VkFriendsService,
        FriendMapper,
        VkFriendsExporterService,
        FriendsJobStreamService])
], VkFriendsExportJobService);
export { VkFriendsExportJobService };
//# sourceMappingURL=vk-friends-export-job.service.js.map