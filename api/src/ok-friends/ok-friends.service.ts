import { Injectable } from '@nestjs/common';
import {
  OkApiService,
  type OkFriendsGetParams,
  type OkUsersGetInfoParams,
  type OkUserInfo,
} from './ok-api.service.js';
import {
  OkFriendsRepository,
  type ExportJobCreateInput,
  type FriendRecordInput,
  type JobCompletionInput,
  type JobFailureInput,
  type JobLogInput,
  type JobProgressUpdateInput,
  type FriendRecordPayload,
} from './repositories/ok-friends.repository.js';
import { MAX_FRIENDS_LIMIT } from './ok-friends.constants.js';

export interface OkFriendsStatusResponse {
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
  rawItems: string[];
}

const DEFAULT_PAGE_SIZE = 5000;

@Injectable()
export class OkFriendsService {
  constructor(
    private readonly okApiService: OkApiService,
    private readonly repository: OkFriendsRepository,
  ) {}

  getStatus(): OkFriendsStatusResponse {
    return { status: 'ok' };
  }

  async fetchAllFriends(
    params: OkFriendsGetParams,
    options: FetchAllFriendsOptions,
  ): Promise<FetchAllFriendsResult> {
    const onProgress = options.onProgress;
    const onLog = options.onLog;

    const normalizedPageSize = this.normalizePageSize(options.pageSize);
    const baseOffset = this.normalizeOffset(params.offset);

    const rawItems: string[] = [];
    let totalCount = 0;
    let fetchedCount = 0;
    let warning: string | undefined;
    let limitApplied = false;
    let offset = baseOffset;

    onLog?.(
      `friends.get start (offset=${offset}, pageSize=${normalizedPageSize})`,
    );

    while (true) {
      const requestLimit = normalizedPageSize;

      const response = await this.okApiService.friendsGet({
        ...params,
        offset,
        limit: requestLimit,
      });

      const friends = response.friends;

      if (totalCount === 0 && friends.length > 0) {
        totalCount = friends.length;
        if (friends.length >= MAX_FRIENDS_LIMIT) {
          limitApplied = true;
          warning = `OK limit: максимум ${MAX_FRIENDS_LIMIT} друзей для обычных пользователей. Возможно, есть еще друзья.`;
          onLog?.(warning);
        }
      }

      if (friends.length > 0) {
        rawItems.push(...friends);
      }
      fetchedCount += friends.length;

      onProgress?.({
        fetchedCount,
        totalCount: totalCount || fetchedCount,
        limitApplied,
      });

      onLog?.(
        `friends.get page fetched (offset=${offset}, items=${friends.length}, total=${totalCount || fetchedCount})`,
      );

      if (friends.length === 0) {
        break;
      }

      if (friends.length < requestLimit) {
        break;
      }

      offset += friends.length;

      if (limitApplied && fetchedCount >= MAX_FRIENDS_LIMIT) {
        break;
      }
    }

    onLog?.(
      `friends.get finish (fetched=${fetchedCount}, total=${totalCount || fetchedCount})`,
    );

    return {
      totalCount: totalCount || fetchedCount,
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

    return Math.min(normalized, MAX_FRIENDS_LIMIT);
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

  async fetchUsersInfo(
    userIds: string[],
    options: {
      fields?: string[];
      emptyPictures?: boolean;
      onProgress?: (progress: { processed: number; total: number }) => void;
      onLog?: (log: string) => void;
    },
  ): Promise<OkUserInfo[]> {
    const onProgress = options.onProgress;
    const onLog = options.onLog;

    if (!userIds || userIds.length === 0) {
      return [];
    }

    const MAX_BATCH_SIZE = 100; // Лимит OK API для users.getInfo
    const allUsers: OkUserInfo[] = [];
    const total = userIds.length;
    let processed = 0;

    onLog?.(`users.getInfo start (total users: ${total})`);

    // Разбиваем на батчи по 100 ID
    for (let i = 0; i < userIds.length; i += MAX_BATCH_SIZE) {
      const batch = userIds.slice(i, i + MAX_BATCH_SIZE);
      const batchNumber = Math.floor(i / MAX_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(userIds.length / MAX_BATCH_SIZE);

      onLog?.(
        `users.getInfo batch ${batchNumber}/${totalBatches} (${batch.length} users)`,
      );

      try {
        const params: OkUsersGetInfoParams = {
          uids: batch,
          fields: options.fields,
          emptyPictures: options.emptyPictures,
        };

        const users = await this.okApiService.usersGetInfo(params);
        allUsers.push(...users);
        processed += batch.length;

        onProgress?.({ processed, total });
        onLog?.(
          `users.getInfo batch ${batchNumber}/${totalBatches} completed (${users.length} users returned)`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        onLog?.(
          `users.getInfo batch ${batchNumber}/${totalBatches} failed: ${errorMessage}`,
        );
        // Продолжаем обработку следующих батчей, даже если один упал
        // Можно добавить опцию для остановки при ошибке, если нужно
      }
    }

    onLog?.(
      `users.getInfo finish (processed: ${processed}, returned: ${allUsers.length})`,
    );

    return allUsers;
  }
}
