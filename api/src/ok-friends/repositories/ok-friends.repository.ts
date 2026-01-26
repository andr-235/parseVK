import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { toCreateJsonValue } from '../../common/utils/prisma-json.utils';

export type ExportJobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
export type JobLogLevel = 'info' | 'warn' | 'error';

export interface ExportJobCreateInput {
  params: unknown;
  okUserId?: string | null;
  status?: ExportJobStatus;
  totalCount?: number | null;
  fetchedCount?: number;
  warning?: string | null;
  error?: string | null;
  xlsxPath?: string | null;
  docxPath?: string | null;
}

export interface JobLogInput {
  level: JobLogLevel;
  message: string;
  meta?: unknown;
}

export interface JobProgressUpdateInput {
  fetchedCount: number;
  totalCount?: number | null;
  warning?: string | null;
  status?: ExportJobStatus;
}

export interface JobCompletionInput {
  fetchedCount: number;
  totalCount?: number | null;
  warning?: string | null;
  xlsxPath?: string | null;
  docxPath?: string | null;
}

export interface JobFailureInput {
  error: string;
  fetchedCount?: number;
  totalCount?: number | null;
  warning?: string | null;
}

export interface FriendRecordInput {
  okFriendId: string;
  payload: unknown;
}

export interface FriendRecordPayload {
  payload: unknown;
}

const DEFAULT_BATCH_SIZE = 1000;
const MIN_BATCH_SIZE = 500;
const MAX_BATCH_SIZE = 1000;

@Injectable()
export class OkFriendsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createJob(input: ExportJobCreateInput) {
    const status = input.status ?? 'PENDING';
    const fetchedCount = this.normalizeCount(input.fetchedCount ?? 0);

    return this.prisma.exportJob.create({
      data: {
        status,
        params: toCreateJsonValue(input.params),
        okUserId: input.okUserId ? BigInt(input.okUserId) : null,
        totalCount: input.totalCount ?? null,
        fetchedCount,
        warning: input.warning ?? null,
        error: input.error ?? null,
        xlsxPath: input.xlsxPath ?? null,
        docxPath: input.docxPath ?? null,
      },
    });
  }

  getJobById(jobId: string) {
    return this.prisma.exportJob.findUnique({
      where: { id: jobId },
    });
  }

  getJobLogs(jobId: string, take = 200) {
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

  async appendLogs(jobId: string, logs: JobLogInput[]): Promise<number> {
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

  setJobProgress(jobId: string, input: JobProgressUpdateInput) {
    const fetchedCount = this.normalizeCount(input.fetchedCount);
    const status = input.status ?? 'RUNNING';

    const data: Prisma.ExportJobUpdateInput = {
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

  completeJob(jobId: string, input: JobCompletionInput) {
    const fetchedCount = this.normalizeCount(input.fetchedCount);

    const data: Prisma.ExportJobUpdateInput = {
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

  failJob(jobId: string, input: JobFailureInput) {
    const data: Prisma.ExportJobUpdateInput = {
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

  async saveFriendsBatch(
    jobId: string,
    records: FriendRecordInput[],
    batchSize = DEFAULT_BATCH_SIZE,
  ): Promise<number> {
    if (!records.length) {
      return 0;
    }

    const normalizedBatchSize = this.normalizeBatchSize(batchSize);
    let inserted = 0;

    for (let i = 0; i < records.length; i += normalizedBatchSize) {
      const chunk = records.slice(i, i + normalizedBatchSize);
      const data = chunk.map((record) => ({
        jobId,
        okFriendId: BigInt(record.okFriendId),
        payload: toCreateJsonValue(record.payload),
      }));

      const result = await this.prisma.friendRecord.createMany({
        data,
      });

      inserted += result.count;
    }

    return inserted;
  }

  getFriendRecordPayloads(jobId: string): Promise<FriendRecordPayload[]> {
    return this.prisma.friendRecord.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
      select: { payload: true },
    });
  }

  private normalizeBatchSize(batchSize: number): number {
    if (!Number.isFinite(batchSize)) {
      return DEFAULT_BATCH_SIZE;
    }

    const normalized = Math.floor(batchSize);
    if (normalized <= 0) {
      return DEFAULT_BATCH_SIZE;
    }

    return Math.min(Math.max(normalized, MIN_BATCH_SIZE), MAX_BATCH_SIZE);
  }

  private normalizeCount(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.floor(value));
  }

  private normalizeTake(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.floor(value));
  }
}
