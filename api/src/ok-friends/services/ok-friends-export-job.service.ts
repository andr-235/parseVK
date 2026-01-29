import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import type {
  FriendRecordInput,
  JobLogLevel,
} from '../repositories/ok-friends.repository.js';
import { OkFriendsExporterService } from './ok-friends-exporter.service.js';
import { OkFriendsJobStreamService } from './ok-friends-job-stream.service.js';
import { OkFriendsService } from '../ok-friends.service.js';
import { EXPORT_BATCH_SIZE } from '../ok-friends.constants.js';
import type { OkFriendsGetParams } from '../ok-api.service.js';
import { flattenUserInfo } from '../utils/flatten-user-info.util.js';
import type { FriendFlatDto } from '../dto/ok-friends.dto.js';

export interface ExportJobProgress {
  fetchedCount: number;
  totalCount: number;
  limitApplied: boolean;
}

@Injectable()
export class OkFriendsExportJobService {
  private readonly logger = new Logger(OkFriendsExportJobService.name);

  constructor(
    private readonly okFriendsService: OkFriendsService,
    private readonly exporter: OkFriendsExporterService,
    private readonly jobStream: OkFriendsJobStreamService,
  ) {}

  async run(jobId: string, params: OkFriendsGetParams): Promise<void> {
    const progressState = {
      fetchedCount: 0,
      totalCount: 0,
      warning: undefined as string | undefined,
    };

    const log = async (level: JobLogLevel, message: string, meta?: unknown) => {
      try {
        await this.okFriendsService.appendLogs(jobId, [
          { level, message, meta },
        ]);
      } catch (err) {
        this.logger.error(
          `Failed to append job log: ${message}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
      this.jobStream.emit(jobId, {
        type: 'log',
        data: { level, message, meta },
      });
    };

    const reportProgress = (payload: ExportJobProgress) => {
      progressState.fetchedCount = payload.fetchedCount;
      progressState.totalCount = payload.totalCount;
      this.jobStream.emit(jobId, { type: 'progress', data: payload });
      void this.okFriendsService
        .setJobProgress(jobId, {
          fetchedCount: payload.fetchedCount,
          totalCount: payload.totalCount,
        })
        .catch((err) => {
          this.logger.error(
            'Failed to update job progress',
            err instanceof Error ? err.stack : String(err),
          );
        });
    };

    try {
      await log('info', 'Export started');
      const { totalCount, fetchedCount, warning, rawItems } =
        await this.okFriendsService.fetchAllFriends(params, {
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

      // Получаем полную информацию о пользователях через users.getInfo
      await log('info', 'Fetching user details via users.getInfo...');

      const usersInfo = await this.okFriendsService.fetchUsersInfo(rawItems, {
        onProgress: (progress) => {
          const percentage = Math.round(
            (progress.processed / progress.total) * 100,
          );
          void log(
            'info',
            `users.getInfo progress: ${progress.processed}/${progress.total} (${percentage}%)`,
          );
        },
        onLog: (msg) => {
          void log('info', msg);
        },
      });

      await log('info', `Fetched user details: ${usersInfo.length} users`);

      // Обновляем записи с полной информацией о пользователях
      const { records, skipped } = this.buildFriendRecordsWithUserInfo(
        rawItems,
        usersInfo,
      );
      if (skipped > 0) {
        await log('warn', `Skipped friends without id: ${skipped}`);
      }

      const inserted = await this.okFriendsService.saveFriendsBatch(
        jobId,
        records,
        EXPORT_BATCH_SIZE,
      );
      await log('info', `Saved friend records: ${inserted}`);

      // Расплющиваем данные для экспорта
      const friendRows: FriendFlatDto[] = usersInfo.map((user) =>
        flattenUserInfo(user),
      );

      await log(
        'info',
        `Flattened ${friendRows.length} user records for export`,
      );

      const xlsxPath = await this.exporter.writeXlsxFile(jobId, friendRows);

      const stats = await fs.stat(xlsxPath);
      if (!stats.isFile() || stats.size === 0) {
        throw new Error(`File verification failed: ${xlsxPath}`);
      }
      this.logger.debug(
        `XLSX file verified: ${xlsxPath}, size: ${stats.size} bytes`,
      );

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      await this.okFriendsService
        .failJob(jobId, {
          error: errorMessage,
          fetchedCount: progressState.fetchedCount,
          totalCount: progressState.totalCount,
          warning: progressState.warning,
        })
        .catch((failErr) => {
          this.logger.error(
            'Failed to mark job as failed',
            failErr instanceof Error ? failErr.stack : String(failErr),
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

  private emitDone(job: {
    id: string;
    status: string;
    fetchedCount: number;
    totalCount: number | null;
    warning: string | null;
    xlsxPath: string | null;
  }): void {
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

  private buildFriendRecordsWithUserInfo(
    rawItems: string[],
    usersInfo: Array<Record<string, unknown>>,
  ): {
    records: FriendRecordInput[];
    skipped: number;
  } {
    const records: FriendRecordInput[] = [];
    let skipped = 0;

    // Создаем map для быстрого поиска информации о пользователе по uid
    const usersMap = new Map<string, Record<string, unknown>>();
    for (const user of usersInfo) {
      const uid = user.uid as string | undefined;
      if (uid) {
        usersMap.set(String(uid), user);
      }
    }

    for (const item of rawItems) {
      if (!item || typeof item !== 'string' || item.trim().length === 0) {
        skipped += 1;
        continue;
      }

      // Ищем информацию о пользователе, если есть
      const userInfo = usersMap.get(item);
      const payload = userInfo || { id: item };

      records.push({ okFriendId: item, payload });
    }
    return { records, skipped };
  }
}
