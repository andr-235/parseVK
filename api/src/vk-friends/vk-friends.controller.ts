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
import { VkFriendsService } from './vk-friends.service';
import { FriendMapper, type VkUserInput } from './mappers/friend.mapper';
import {
  VkFriendsExportRequestDto,
  VkFriendsParamsDto,
} from './dto/vk-friends.dto';
import { VkFriendsExporterService } from './services/vk-friends-exporter.service';
import { VkFriendsJobStreamService } from './services/vk-friends-job-stream.service';
import type {
  FriendRecordInput,
  JobLogLevel,
} from './repositories/vk-friends.repository';

const EXPORT_BATCH_SIZE = 1000;
const EXPORT_DIR = path.resolve(process.cwd(), '.temp', 'vk-friends');
const DEFAULT_FRIEND_FIELDS: VkFriendsParamsDto['fields'] = [
  'nickname',
  'domain',
  'bdate',
  'sex',
  'status',
  'online',
  'last_seen',
  'city',
  'country',
  'has_mobile',
  'can_post',
  'can_see_all_posts',
  'can_write_private_message',
  'timezone',
  'photo_50',
  'photo_100',
  'photo_200_orig',
  'photo_id',
  'relation',
  'contacts',
  'education',
  'universities',
];

@Controller('vk/friends')
export class VkFriendsController {
  private readonly logger = new Logger(VkFriendsController.name);

  constructor(
    private readonly vkFriendsService: VkFriendsService,
    private readonly friendMapper: FriendMapper,
    private readonly exporter: VkFriendsExporterService,
    private readonly jobStream: VkFriendsJobStreamService,
  ) {}

  @Post('export')
  async export(@Body() body: VkFriendsExportRequestDto) {
    if (!body.params) {
      throw new BadRequestException('params is required');
    }

    const params = this.buildParams(body.params);
    const job = await this.vkFriendsService.createJob({
      params,
      status: 'RUNNING',
      vkUserId: params.user_id ?? null,
    });

    this.jobStream.emit(job.id, {
      type: 'progress',
      data: { fetchedCount: 0, totalCount: 0, limitApplied: false },
    });

    void this.runExportJob(job.id, params);

    return {
      jobId: job.id,
      status: job.status,
    };
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

    return {
      job,
      logs,
    };
  }

  @Get('jobs/:jobId/download/docx')
  async downloadDocx(
    @Param('jobId', new ParseUUIDPipe({ version: '4' })) jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { filePath } = await this.resolveDownloadPath(jobId);

      // Финальная проверка существования файла перед скачиванием
      try {
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) {
          throw new Error('Path is not a file');
        }
      } catch (accessError) {
        this.logger.error(
          `File not accessible before download: ${filePath}`,
          accessError,
        );
        throw new NotFoundException('Export file not accessible');
      }

      this.logger.debug(`Downloading file: ${filePath}`);

      res.download(filePath, path.basename(filePath), (err) => {
        if (err) {
          this.logger.error(`Failed to download file: ${filePath}`, err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download file' });
          }
        } else {
          this.logger.debug(`File downloaded successfully: ${filePath}`);
        }
      });
    } catch (error) {
      this.logger.error(`Error downloading file for job ${jobId}`, error);
      if (!res.headersSent) {
        if (
          error instanceof NotFoundException ||
          error instanceof BadRequestException
        ) {
          throw error;
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
          return of({
            type: 'done',
            data: {
              jobId: job.id,
              status: job.status,
              fetchedCount: job.fetchedCount,
              totalCount: job.totalCount ?? undefined,
              warning: job.warning ?? undefined,
              docxPath: job.docxPath ?? undefined,
            },
          });
        }
        if (job.status === 'FAILED') {
          return of({
            type: 'error',
            data: {
              message: job.error ?? 'Export failed',
            },
          });
        }
        return this.jobStream.getStream(jobId);
      }),
    );
  }

  private async runExportJob(
    jobId: string,
    params: VkFriendsParamsDto,
  ): Promise<void> {
    const progressState = {
      fetchedCount: 0,
      totalCount: 0,
      warning: undefined as string | undefined,
    };

    const log = async (level: JobLogLevel, message: string, meta?: unknown) => {
      try {
        await this.vkFriendsService.appendLogs(jobId, [
          {
            level,
            message,
            meta,
          },
        ]);
      } catch (error) {
        this.logger.error(
          `Failed to append job log: ${message}`,
          error instanceof Error ? error.stack : String(error),
        );
      }

      this.jobStream.emit(jobId, {
        type: 'log',
        data: { level, message, meta },
      });
    };

    const reportProgress = (payload: {
      fetchedCount: number;
      totalCount: number;
      limitApplied: boolean;
    }) => {
      progressState.fetchedCount = payload.fetchedCount;
      progressState.totalCount = payload.totalCount;

      this.jobStream.emit(jobId, {
        type: 'progress',
        data: payload,
      });

      void this.vkFriendsService
        .setJobProgress(jobId, {
          fetchedCount: payload.fetchedCount,
          totalCount: payload.totalCount,
        })
        .catch((error) => {
          this.logger.error(
            'Failed to update job progress',
            error instanceof Error ? error.stack : String(error),
          );
        });
    };

    try {
      await log('info', 'Export started');

      const { totalCount, fetchedCount, warning, rawItems } =
        await this.vkFriendsService.fetchAllFriends(params, {
          onProgress: (progress) => {
            reportProgress(progress);
          },
          onLog: (message) => {
            const level = message.startsWith('VK limit:') ? 'warn' : 'info';
            void log(level, message);
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

      await log('info', 'Fetch completed', {
        totalCount,
        fetchedCount,
      });

      const { records, skipped } = this.buildFriendRecords(rawItems);

      if (skipped > 0) {
        await log('warn', `Skipped friends without id: ${skipped}`);
      }

      const inserted = await this.vkFriendsService.saveFriendsBatch(
        jobId,
        records,
        EXPORT_BATCH_SIZE,
      );

      await log('info', `Saved friend records: ${inserted}`);

      const friendRows = rawItems.map((item) =>
        this.friendMapper.mapVkUserToFlatDto(item),
      );

      const docxPath = await this.exporter.writeDocxFile(jobId, friendRows);
      await log('info', 'DOCX generated', { path: docxPath });

      const completedJob = await this.vkFriendsService.completeJob(jobId, {
        fetchedCount,
        totalCount,
        warning,
        docxPath,
      });

      await log('info', 'Export completed');

      this.jobStream.emit(jobId, {
        type: 'done',
        data: {
          jobId: completedJob.id,
          status: completedJob.status,
          fetchedCount: completedJob.fetchedCount,
          totalCount: completedJob.totalCount,
          warning: completedJob.warning ?? undefined,
          docxPath: completedJob.docxPath ?? undefined,
        },
      });

      this.jobStream.complete(jobId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Export failed';

      await this.vkFriendsService
        .failJob(jobId, {
          error: errorMessage,
          fetchedCount: progressState.fetchedCount,
          totalCount: progressState.totalCount,
          warning: progressState.warning,
        })
        .catch((failError) => {
          this.logger.error(
            'Failed to mark job as failed',
            failError instanceof Error ? failError.stack : String(failError),
          );
        });

      await log('error', 'Export failed', { message: errorMessage });

      this.jobStream.emit(jobId, {
        type: 'error',
        data: { message: errorMessage },
      });

      this.jobStream.complete(jobId);
    }
  }

  private buildFriendRecords(rawItems: unknown[]): {
    records: FriendRecordInput[];
    skipped: number;
  } {
    const records: FriendRecordInput[] = [];
    let skipped = 0;

    for (const item of rawItems) {
      const vkFriendId = this.extractFriendId(item);
      if (vkFriendId === null) {
        skipped += 1;
        continue;
      }

      records.push({
        vkFriendId,
        payload: item,
      });
    }

    return { records, skipped };
  }

  private extractFriendId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    if (value && typeof value === 'object') {
      const idValue = (value as { id?: unknown }).id;
      if (typeof idValue === 'number' && Number.isFinite(idValue)) {
        return Math.trunc(idValue);
      }
    }

    return null;
  }

  private buildParams(
    dto: VkFriendsParamsDto,
    overrides?: Partial<VkFriendsParamsDto>,
  ): VkFriendsParamsDto {
    const fields = overrides?.fields ?? dto.fields;

    return {
      user_id: overrides?.user_id ?? dto.user_id,
      order: overrides?.order ?? dto.order,
      list_id: overrides?.list_id ?? dto.list_id,
      count: overrides?.count ?? dto.count,
      offset: overrides?.offset ?? dto.offset,
      fields: this.resolveFields(fields),
      name_case: overrides?.name_case ?? dto.name_case,
      ref: overrides?.ref ?? dto.ref,
    };
  }

  private resolveFields(
    fields?: VkFriendsParamsDto['fields'],
  ): VkFriendsParamsDto['fields'] {
    if (!Array.isArray(fields) || fields.length === 0) {
      return DEFAULT_FRIEND_FIELDS;
    }

    return fields;
  }

  private async resolveDownloadPath(
    jobId: string,
  ): Promise<{ filePath: string }> {
    const job = await this.vkFriendsService.getJobById(jobId);
    if (!job) {
      throw new NotFoundException('Export job not found');
    }

    if (job.status !== 'DONE') {
      throw new BadRequestException('Export job is not completed');
    }

    const filePath = job.docxPath;
    if (!filePath) {
      throw new NotFoundException('Export file not found');
    }

    // Нормализуем путь - убираем относительные компоненты и приводим к абсолютному
    let resolvedPath = path.resolve(filePath);

    // Если путь относительный, делаем его абсолютным относительно EXPORT_DIR
    if (!path.isAbsolute(resolvedPath)) {
      resolvedPath = path.resolve(EXPORT_DIR, resolvedPath);
    }

    // Проверяем, что путь находится в EXPORT_DIR
    const normalizedExportDir = path.resolve(EXPORT_DIR);
    const normalizedResolvedPath = path.resolve(resolvedPath);

    if (!normalizedResolvedPath.startsWith(normalizedExportDir + path.sep)) {
      this.logger.warn(
        `Invalid export file path: ${normalizedResolvedPath} (expected in ${normalizedExportDir})`,
      );
      throw new BadRequestException('Invalid export file path');
    }

    try {
      const stats = await fs.stat(normalizedResolvedPath);
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }
      this.logger.debug(`File found: ${normalizedResolvedPath}`);
    } catch {
      this.logger.warn(
        `File not found at ${normalizedResolvedPath}, attempting to rebuild`,
      );
      const rebuiltPath = await this.rebuildExportFile(job);
      return { filePath: path.resolve(rebuiltPath) };
    }

    return { filePath: normalizedResolvedPath };
  }

  private async rebuildExportFile(job: {
    id: string;
    fetchedCount: number;
    totalCount: number | null;
    warning: string | null;
    params: unknown;
    xlsxPath: string | null;
    docxPath: string | null;
  }): Promise<string> {
    const records = await this.vkFriendsService.getFriendRecordPayloads(job.id);

    if (records.length === 0) {
      throw new NotFoundException('Export file not found');
    }

    const friendRows = records.map((record) =>
      this.friendMapper.mapVkUserToFlatDto(record.payload as VkUserInput),
    );

    const filePath = await this.exporter.writeDocxFile(job.id, friendRows);

    await this.vkFriendsService.completeJob(job.id, {
      fetchedCount: job.fetchedCount,
      totalCount: job.totalCount ?? undefined,
      warning: job.warning ?? undefined,
      docxPath: filePath,
    });

    this.logger.warn(`Export file regenerated for job ${job.id}`);

    return filePath;
  }
}
