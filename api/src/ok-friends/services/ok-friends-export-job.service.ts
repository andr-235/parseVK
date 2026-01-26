import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import type {
  FriendRecordInput,
  JobLogLevel,
} from '../repositories/ok-friends.repository';
import { OkFriendsExporterService } from './ok-friends-exporter.service';
import { OkFriendsJobStreamService } from './ok-friends-job-stream.service';
import { OkFriendsService } from '../ok-friends.service';
import { EXPORT_BATCH_SIZE } from '../ok-friends.constants';
import type { OkFriendsGetParams } from '../ok-api.service';

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

      const { records, skipped } = this.buildFriendRecords(rawItems);
      if (skipped > 0) {
        await log('warn', `Skipped friends without id: ${skipped}`);
      }

      const inserted = await this.okFriendsService.saveFriendsBatch(
        jobId,
        records,
        EXPORT_BATCH_SIZE,
      );
      await log('info', `Saved friend records: ${inserted}`);

      const friendRows = rawItems.map((id) => ({ id }));
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

  private buildFriendRecords(rawItems: string[]): {
    records: FriendRecordInput[];
    skipped: number;
  } {
    const records: FriendRecordInput[] = [];
    let skipped = 0;
    for (const item of rawItems) {
      if (!item || typeof item !== 'string' || item.trim().length === 0) {
        skipped += 1;
        continue;
      }
      records.push({ okFriendId: item, payload: { id: item } });
    }
    return { records, skipped };
  }
}
