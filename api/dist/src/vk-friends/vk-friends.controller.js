var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var VkFriendsController_1;
import { BadRequestException, Body, Controller, Get, Logger, NotFoundException, Param, ParseUUIDPipe, Post, Res, Sse, } from '@nestjs/common';
import { promises as fs } from 'fs';
import path from 'path';
import { defer, from, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { VkFriendsService } from './vk-friends.service.js';
import { VkFriendsExportRequestDto } from './dto/vk-friends.dto.js';
import { FriendsJobStreamService } from '../common/friends-export/services/friends-job-stream.service.js';
import { VkFriendsExportJobService } from './services/vk-friends-export-job.service.js';
import { VkFriendsFileService } from './services/vk-friends-file.service.js';
import { buildParams } from './vk-friends-params.util.js';
let VkFriendsController = VkFriendsController_1 = class VkFriendsController {
    vkFriendsService;
    exportJobService;
    fileService;
    jobStream;
    logger = new Logger(VkFriendsController_1.name);
    constructor(vkFriendsService, exportJobService, fileService, jobStream) {
        this.vkFriendsService = vkFriendsService;
        this.exportJobService = exportJobService;
        this.fileService = fileService;
        this.jobStream = jobStream;
    }
    async export(body) {
        if (!body.params) {
            throw new BadRequestException('params is required');
        }
        const params = buildParams(body.params);
        const job = await this.vkFriendsService.createJob({
            params,
            status: 'RUNNING',
            vkUserId: params.user_id ?? null,
        });
        this.jobStream.emit(job.id, {
            type: 'progress',
            data: { fetchedCount: 0, totalCount: 0, limitApplied: false },
        });
        void this.exportJobService.run(job.id, params);
        return { jobId: job.id, status: job.status };
    }
    async getJob(jobId) {
        const job = await this.vkFriendsService.getJobById(jobId);
        if (!job) {
            throw new NotFoundException('Export job not found');
        }
        const logs = await this.vkFriendsService.getJobLogs(jobId, 200);
        return { job, logs };
    }
    async downloadXlsx(jobId, res) {
        try {
            const filePath = await this.fileService.getExportFilePath(jobId);
            const buffer = await fs.readFile(filePath);
            const fileName = path.basename(filePath);
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': String(buffer.length),
            });
            res.end(buffer);
            this.logger.debug(`File sent successfully: ${filePath}`);
        }
        catch (err) {
            this.logger.error(`Error downloading file for job ${jobId}`, err);
            if (!res.headersSent) {
                if (err instanceof NotFoundException ||
                    err instanceof BadRequestException) {
                    throw err;
                }
                throw new NotFoundException('Export file not found');
            }
        }
    }
    streamJob(jobId) {
        return defer(() => from(this.vkFriendsService.getJobById(jobId))).pipe(mergeMap((job) => {
            if (!job) {
                throw new NotFoundException('Export job not found');
            }
            if (job.status === 'DONE') {
                return of(this.toDoneEvent(job));
            }
            if (job.status === 'FAILED') {
                return of({
                    type: 'error',
                    data: { message: job.error ?? 'Export failed' },
                });
            }
            return this.jobStream.getStream(jobId);
        }));
    }
    toDoneEvent(job) {
        return {
            type: 'done',
            data: {
                jobId: job.id,
                status: job.status,
                fetchedCount: job.fetchedCount,
                totalCount: job.totalCount ?? undefined,
                warning: job.warning ?? undefined,
                xlsxPath: job.xlsxPath ?? undefined,
            },
        };
    }
};
__decorate([
    Post('export'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VkFriendsExportRequestDto]),
    __metadata("design:returntype", Promise)
], VkFriendsController.prototype, "export", null);
__decorate([
    Get('jobs/:jobId'),
    __param(0, Param('jobId', new ParseUUIDPipe({ version: '4' }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VkFriendsController.prototype, "getJob", null);
__decorate([
    Get('jobs/:jobId/download/xlsx'),
    __param(0, Param('jobId', new ParseUUIDPipe({ version: '4' }))),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VkFriendsController.prototype, "downloadXlsx", null);
__decorate([
    Sse('jobs/:jobId/stream'),
    __param(0, Param('jobId', new ParseUUIDPipe({ version: '4' }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Function)
], VkFriendsController.prototype, "streamJob", null);
VkFriendsController = VkFriendsController_1 = __decorate([
    Controller('vk/friends'),
    __metadata("design:paramtypes", [VkFriendsService,
        VkFriendsExportJobService,
        VkFriendsFileService,
        FriendsJobStreamService])
], VkFriendsController);
export { VkFriendsController };
//# sourceMappingURL=vk-friends.controller.js.map