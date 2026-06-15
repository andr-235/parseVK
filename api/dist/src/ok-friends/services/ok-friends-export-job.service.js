var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OkFriendsExportJobService_1;
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { OkFriendsExporterService } from './ok-friends-exporter.service.js';
import { FriendsJobStreamService } from '../../common/friends-export/services/friends-job-stream.service.js';
import { OkFriendsService } from '../ok-friends.service.js';
import { EXPORT_BATCH_SIZE } from '../ok-friends.constants.js';
import { flattenUserInfo } from '../utils/flatten-user-info.util.js';
let OkFriendsExportJobService = OkFriendsExportJobService_1 = class OkFriendsExportJobService {
    okFriendsService;
    exporter;
    jobStream;
    logger = new Logger(OkFriendsExportJobService_1.name);
    constructor(okFriendsService, exporter, jobStream) {
        this.okFriendsService = okFriendsService;
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
                await this.okFriendsService.appendLogs(jobId, [
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
            void this.okFriendsService
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
            const { totalCount, fetchedCount, warning, rawItems } = await this.okFriendsService.fetchAllFriends(params, {
                onProgress: reportProgress,
                onLog: (msg) => {
                    const level = msg.startsWith('OK limit:') ? 'warn' : 'info';
                    void log(level, msg);
                },
            });
            progressState.totalCount = totalCount;
            progressState.fetchedCount = fetchedCount;
            progressState.warning = warning;
            if (warning) {
                await this.okFriendsService.setJobProgress(jobId, {
                    fetchedCount,
                    totalCount,
                    warning,
                });
            }
            await log('info', 'Fetch completed', { totalCount, fetchedCount });
            await log('info', 'Fetching user details via users.getInfo...');
            const usersInfo = await this.okFriendsService.fetchUsersInfo(rawItems, {
                onProgress: (progress) => {
                    const percentage = Math.round((progress.processed / progress.total) * 100);
                    void log('info', `users.getInfo progress: ${progress.processed}/${progress.total} (${percentage}%)`);
                },
                onLog: (msg) => {
                    void log('info', msg);
                },
            });
            await log('info', `Fetched user details: ${usersInfo.length} users`);
            const { records, skipped } = this.buildFriendRecordsWithUserInfo(rawItems, usersInfo);
            if (skipped > 0) {
                await log('warn', `Skipped friends without id: ${skipped}`);
            }
            const inserted = await this.okFriendsService.saveFriendsBatch(jobId, records, EXPORT_BATCH_SIZE);
            await log('info', `Saved friend records: ${inserted}`);
            const friendRows = usersInfo.map((user) => flattenUserInfo(user));
            await log('info', `Flattened ${friendRows.length} user records for export`);
            const xlsxPath = await this.exporter.writeXlsxFile(jobId, friendRows);
            const stats = await fs.stat(xlsxPath);
            if (!stats.isFile() || stats.size === 0) {
                throw new Error(`File verification failed: ${xlsxPath}`);
            }
            this.logger.debug(`XLSX file verified: ${xlsxPath}, size: ${stats.size} bytes`);
            await log('info', 'XLSX generated', { path: xlsxPath });
            const completedJob = await this.okFriendsService.completeJob(jobId, {
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
            await this.okFriendsService
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
    buildFriendRecordsWithUserInfo(rawItems, usersInfo) {
        const records = [];
        let skipped = 0;
        const usersMap = new Map();
        for (const user of usersInfo) {
            const uid = user.uid;
            if (uid) {
                usersMap.set(String(uid), user);
            }
        }
        for (const item of rawItems) {
            if (!item || typeof item !== 'string' || item.trim().length === 0) {
                skipped += 1;
                continue;
            }
            const userInfo = usersMap.get(item);
            const payload = userInfo || { id: item };
            records.push({ okFriendId: item, payload });
        }
        return { records, skipped };
    }
};
OkFriendsExportJobService = OkFriendsExportJobService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [OkFriendsService,
        OkFriendsExporterService,
        FriendsJobStreamService])
], OkFriendsExportJobService);
export { OkFriendsExportJobService };
//# sourceMappingURL=ok-friends-export-job.service.js.map