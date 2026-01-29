import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  Sse,
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import type { Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { defer, from, of, type Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { VkFriendsService } from './vk-friends.service.js';
import { VkFriendsExportRequestDto } from './dto/vk-friends.dto.js';
import { VkFriendsJobStreamService } from './services/vk-friends-job-stream.service.js';
import { VkFriendsExportJobService } from './services/vk-friends-export-job.service.js';
import { VkFriendsFileService } from './services/vk-friends-file.service.js';
import { buildParams } from './vk-friends-params.util.js';

@Controller('vk/friends')
export class VkFriendsController {
  private readonly logger = new Logger(VkFriendsController.name);

  constructor(
    private readonly vkFriendsService: VkFriendsService,
    private readonly exportJobService: VkFriendsExportJobService,
    private readonly fileService: VkFriendsFileService,
    private readonly jobStream: VkFriendsJobStreamService,
  ) {}

  @Post('export')
  async export(@Body() body: VkFriendsExportRequestDto) {
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

  @Get('jobs/:jobId')
  async getJob(
    @Param('jobId', new ParseUUIDPipe({ version: '4' })) jobId: string,
  ) {
    const job = await this.vkFriendsService.getJobById(jobId);
    if (!job) {
      throw new NotFoundException('Export job not found');
    }
    const logs = await this.vkFriendsService.getJobLogs(jobId, 200);
    return { job, logs };
  }

  @Get('jobs/:jobId/download/xlsx')
  async downloadXlsx(
    @Param('jobId', new ParseUUIDPipe({ version: '4' })) jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const filePath = await this.fileService.getExportFilePath(jobId);
      const buffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(buffer.length),
      });
      res.end(buffer);
      this.logger.debug(`File sent successfully: ${filePath}`);
    } catch (err) {
      this.logger.error(`Error downloading file for job ${jobId}`, err);
      if (!res.headersSent) {
        if (
          err instanceof NotFoundException ||
          err instanceof BadRequestException
        ) {
          throw err;
        }
        throw new NotFoundException('Export file not found');
      }
    }
  }

  @Sse('jobs/:jobId/stream')
  streamJob(
    @Param('jobId', new ParseUUIDPipe({ version: '4' })) jobId: string,
  ): Observable<MessageEvent> {
    return defer(() => from(this.vkFriendsService.getJobById(jobId))).pipe(
      mergeMap((job) => {
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
      }),
    );
  }

  private toDoneEvent(job: {
    id: string;
    status: string;
    fetchedCount: number;
    totalCount: number | null;
    warning: string | null;
    xlsxPath: string | null;
  }): MessageEvent {
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
}
