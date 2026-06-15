var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OkFriendsFileService_1;
import { BadRequestException, Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { promises as fs } from 'fs';
import path from 'path';
import { OkFriendsExporterService } from './ok-friends-exporter.service.js';
import { OkFriendsService } from '../ok-friends.service.js';
import { EXPORT_DIR } from '../ok-friends.constants.js';
let OkFriendsFileService = OkFriendsFileService_1 = class OkFriendsFileService {
    okFriendsService;
    exporter;
    logger = new Logger(OkFriendsFileService_1.name);
    constructor(okFriendsService, exporter) {
        this.okFriendsService = okFriendsService;
        this.exporter = exporter;
    }
    async getExportFilePath(jobId) {
        const job = await this.okFriendsService.getJobById(jobId);
        if (!job) {
            throw new NotFoundException('Export job not found');
        }
        if (job.status !== 'DONE') {
            throw new BadRequestException('Export job is not completed');
        }
        const filePath = job.xlsxPath;
        if (!filePath) {
            throw new NotFoundException('Export file not found');
        }
        let resolvedPath = path.resolve(filePath);
        if (!path.isAbsolute(resolvedPath)) {
            resolvedPath = path.resolve(EXPORT_DIR, resolvedPath);
        }
        const normalizedDir = path.resolve(EXPORT_DIR);
        const normalizedPath = path.resolve(resolvedPath);
        if (!normalizedPath.startsWith(normalizedDir + path.sep)) {
            this.logger.warn(`Invalid export file path: ${normalizedPath} (expected in ${normalizedDir})`);
            throw new BadRequestException('Invalid export file path');
        }
        try {
            const stats = await fs.stat(normalizedPath);
            if (!stats.isFile()) {
                throw new Error('Path is not a file');
            }
            this.logger.debug(`File found: ${normalizedPath}, size: ${stats.size} bytes`);
            return normalizedPath;
        }
        catch (err) {
            this.logger.warn(`File not found at ${normalizedPath}, attempting to rebuild. Error: ${err instanceof Error ? err.message : String(err)}`);
            return this.rebuildExportFile(job);
        }
    }
    async rebuildExportFile(job) {
        const records = await this.okFriendsService.getFriendRecordPayloads(job.id);
        if (records.length === 0) {
            throw new NotFoundException('Export file not found');
        }
        const friendRows = records.map((record) => {
            const payload = record.payload;
            return { id: payload?.id ?? null };
        });
        const filePath = await this.exporter.writeXlsxFile(job.id, friendRows);
        await this.okFriendsService.completeJob(job.id, {
            fetchedCount: job.fetchedCount,
            totalCount: job.totalCount ?? undefined,
            warning: job.warning ?? undefined,
            xlsxPath: filePath,
        });
        this.logger.warn(`Export file regenerated for job ${job.id}`);
        return path.resolve(filePath);
    }
};
OkFriendsFileService = OkFriendsFileService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [OkFriendsService,
        OkFriendsExporterService])
], OkFriendsFileService);
export { OkFriendsFileService };
//# sourceMappingURL=ok-friends-file.service.js.map