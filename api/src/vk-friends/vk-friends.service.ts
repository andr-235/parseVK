import { Injectable } from '@nestjs/common';
import type { Responses } from 'vk-io';
import { VkApiService } from './vk-api.service';
import type { VkFriendsGetParams } from './vk-api.service';
import {
  VkFriendsRepository,
  type ExportJobCreateInput,
  type FriendRecordInput,
  type JobCompletionInput,
  type JobFailureInput,
  type JobLogInput,
  type JobProgressUpdateInput,
  type FriendRecordPayload,
} from './repositories/vk-friends.repository';

export interface VkFriendsStatusResponse {
  status: 'ok';
}

export interface FetchAllFriendsProgress {
  fetchedCount: number;
  totalCount: number;
  limitApplied: boolean;
}

export interface FetchAllFriendsOptions {
  pageSize?: number;
  onProgress?: (progress: FetchAllFriendsProgress) => void;
  onLog?: (log: string) => void;
}

export interface FetchAllFriendsResult {
  totalCount: number;
  fetchedCount: number;
  warning?: string;
  rawItems: VkFriendItem[];
}

type VkFriendItem = Responses.FriendsGetResponse['items'][number];

const DEFAULT_PAGE_SIZE = 1000;
const MAX_PAGE_SIZE = 5000;
const HARD_LIMIT_WITH_FIELDS = 5000;

@Injectable()
export class VkFriendsService {
  constructor(
    private readonly vkApiService: VkApiService,
    private readonly repository: VkFriendsRepository,
  ) {}

  getStatus(): VkFriendsStatusResponse {
    return { status: 'ok' };
  }

  async fetchAllFriends(
    params: VkFriendsGetParams,
    options: FetchAllFriendsOptions,
  ): Promise<FetchAllFriendsResult> {
    const onProgress = options.onProgress;
    const onLog = options.onLog;

    const normalizedPageSize = this.normalizePageSize(options.pageSize);
    const requestedLimit = this.normalizeLimit(params.count);
    const baseOffset = this.normalizeOffset(params.offset);
    const hasFields = Array.isArray(params.fields) && params.fields.length > 0;

    const rawItems: VkFriendItem[] = [];
    let totalCount = 0;
    let fetchedCount = 0;
    let warning: string | undefined;
    let effectiveLimit: number | undefined;
    let limitApplied = false;
    let offset = baseOffset;

    onLog?.(
      `friends.get start (offset=${offset}, pageSize=${normalizedPageSize})`,
    );

    if (requestedLimit !== undefined && requestedLimit <= 0) {
      onLog?.('friends.get finish (fetched=0, total=0)');
      return {
        totalCount,
        fetchedCount,
        warning,
        rawItems,
      };
    }

    while (true) {
      const remainingLimit =
        effectiveLimit !== undefined
          ? effectiveLimit - fetchedCount
          : requestedLimit !== undefined
            ? requestedLimit - fetchedCount
            : undefined;

      if (remainingLimit !== undefined && remainingLimit <= 0) {
        break;
      }

      const requestCount =
        remainingLimit !== undefined
          ? Math.max(0, Math.min(normalizedPageSize, remainingLimit))
          : normalizedPageSize;

      if (requestCount <= 0) {
        break;
      }

      const response = await this.vkApiService.friendsGet({
        ...params,
        offset,
        count: requestCount,
      });

      if (effectiveLimit === undefined) {
        totalCount = typeof response.count === 'number' ? response.count : 0;
        let hardLimit: number | undefined;

        if (hasFields && totalCount > HARD_LIMIT_WITH_FIELDS) {
          hardLimit = HARD_LIMIT_WITH_FIELDS;
        }

        effectiveLimit = totalCount;
        if (requestedLimit !== undefined) {
          effectiveLimit = Math.min(effectiveLimit, requestedLimit);
        }
        if (hardLimit !== undefined) {
          effectiveLimit = Math.min(effectiveLimit, hardLimit);
        }

        limitApplied = effectiveLimit < totalCount;

        if (
          hardLimit !== undefined &&
          totalCount > hardLimit &&
          effectiveLimit === hardLimit
        ) {
          warning = `VK limit: при fields максимум 5000. Выгружено 5000 из ${totalCount}.`;
          onLog?.(warning);
        }
      }

      const items = Array.isArray(response.items) ? response.items : [];
      let pageItems = items;

      if (effectiveLimit !== undefined) {
        const remaining = effectiveLimit - fetchedCount;
        if (remaining <= 0) {
          pageItems = [];
        } else if (pageItems.length > remaining) {
          pageItems = pageItems.slice(0, remaining);
        }
      }

      if (pageItems.length > 0) {
        rawItems.push(...pageItems);
      }
      fetchedCount += pageItems.length;

      onProgress?.({
        fetchedCount,
        totalCount,
        limitApplied,
      });

      onLog?.(
        `friends.get page fetched (offset=${offset}, items=${pageItems.length}, total=${totalCount})`,
      );

      if (pageItems.length === 0) {
        break;
      }

      offset += items.length;

      if (effectiveLimit !== undefined && fetchedCount >= effectiveLimit) {
        break;
      }

      if (items.length < requestCount) {
        break;
      }
    }

    onLog?.(
      `friends.get finish (fetched=${fetchedCount}, total=${totalCount})`,
    );

    return {
      totalCount,
      fetchedCount,
      warning,
      rawItems,
    };
  }

  private normalizePageSize(pageSize?: number): number {
    if (typeof pageSize !== 'number' || Number.isNaN(pageSize)) {
      return DEFAULT_PAGE_SIZE;
    }

    const normalized = Math.floor(pageSize);
    if (normalized <= 0) {
      return DEFAULT_PAGE_SIZE;
    }

    return Math.min(normalized, MAX_PAGE_SIZE);
  }

  private normalizeLimit(limit?: number): number | undefined {
    if (typeof limit !== 'number' || Number.isNaN(limit)) {
      return undefined;
    }

    return Math.max(0, Math.floor(limit));
  }

  private normalizeOffset(offset?: number): number {
    if (typeof offset !== 'number' || Number.isNaN(offset)) {
      return 0;
    }

    return Math.max(0, Math.floor(offset));
  }

  createJob(input: ExportJobCreateInput) {
    return this.repository.createJob(input);
  }

  appendLogs(jobId: string, logs: JobLogInput[]): Promise<number> {
    return this.repository.appendLogs(jobId, logs);
  }

  setJobProgress(jobId: string, input: JobProgressUpdateInput) {
    return this.repository.setJobProgress(jobId, input);
  }

  completeJob(jobId: string, input: JobCompletionInput) {
    return this.repository.completeJob(jobId, input);
  }

  failJob(jobId: string, input: JobFailureInput) {
    return this.repository.failJob(jobId, input);
  }

  saveFriendsBatch(
    jobId: string,
    records: FriendRecordInput[],
    batchSize?: number,
  ): Promise<number> {
    return this.repository.saveFriendsBatch(jobId, records, batchSize);
  }

  getFriendRecordPayloads(jobId: string): Promise<FriendRecordPayload[]> {
    return this.repository.getFriendRecordPayloads(jobId);
  }

  getJobById(jobId: string) {
    return this.repository.getJobById(jobId);
  }

  getJobLogs(jobId: string, take?: number) {
    return this.repository.getJobLogs(jobId, take);
  }
}
