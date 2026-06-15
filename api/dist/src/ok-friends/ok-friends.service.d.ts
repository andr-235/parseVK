import { OkApiService, type OkFriendsGetParams, type OkUserInfo } from './ok-api.service.js';
import { OkFriendsRepository, type ExportJobCreateInput, type FriendRecordInput, type JobCompletionInput, type JobFailureInput, type JobLogInput, type JobProgressUpdateInput, type FriendRecordPayload } from './repositories/ok-friends.repository.js';
export interface OkFriendsStatusResponse {
    status: 'ok';
}
import type { FetchAllFriendsProgress, FetchAllFriendsOptions, FetchAllFriendsResult as BaseFetchAllFriendsResult } from '../common/friends-export/interfaces/friends-export.interfaces.js';
export type { FetchAllFriendsProgress, FetchAllFriendsOptions };
export type FetchAllFriendsResult = BaseFetchAllFriendsResult<string>;
export declare class OkFriendsService {
    private readonly okApiService;
    private readonly repository;
    constructor(okApiService: OkApiService, repository: OkFriendsRepository);
    getStatus(): OkFriendsStatusResponse;
    fetchAllFriends(params: OkFriendsGetParams, options: FetchAllFriendsOptions): Promise<FetchAllFriendsResult>;
    private normalizePageSize;
    private normalizeOffset;
    createJob(input: ExportJobCreateInput): import("../generated/prisma/models.js").Prisma__ExportJobClient<{
        error: string | null;
        id: string;
        status: import("../generated/prisma/enums.js").ExportJobStatus;
        createdAt: Date;
        params: import("@prisma/client/runtime/client.js").JsonValue;
        vkUserId: number | null;
        okUserId: bigint | null;
        totalCount: number | null;
        fetchedCount: number;
        warning: string | null;
        xlsxPath: string | null;
        docxPath: string | null;
    }, never, import("@prisma/client/runtime/client.js").DefaultArgs, {
        omit: import("../generated/prisma/internal/prismaNamespace.js").GlobalOmitConfig | undefined;
    }>;
    appendLogs(jobId: string, logs: JobLogInput[]): Promise<number>;
    setJobProgress(jobId: string, input: JobProgressUpdateInput): import("../generated/prisma/models.js").Prisma__ExportJobClient<{
        error: string | null;
        id: string;
        status: import("../generated/prisma/enums.js").ExportJobStatus;
        createdAt: Date;
        params: import("@prisma/client/runtime/client.js").JsonValue;
        vkUserId: number | null;
        okUserId: bigint | null;
        totalCount: number | null;
        fetchedCount: number;
        warning: string | null;
        xlsxPath: string | null;
        docxPath: string | null;
    }, never, import("@prisma/client/runtime/client.js").DefaultArgs, {
        omit: import("../generated/prisma/internal/prismaNamespace.js").GlobalOmitConfig | undefined;
    }>;
    completeJob(jobId: string, input: JobCompletionInput): import("../generated/prisma/models.js").Prisma__ExportJobClient<{
        error: string | null;
        id: string;
        status: import("../generated/prisma/enums.js").ExportJobStatus;
        createdAt: Date;
        params: import("@prisma/client/runtime/client.js").JsonValue;
        vkUserId: number | null;
        okUserId: bigint | null;
        totalCount: number | null;
        fetchedCount: number;
        warning: string | null;
        xlsxPath: string | null;
        docxPath: string | null;
    }, never, import("@prisma/client/runtime/client.js").DefaultArgs, {
        omit: import("../generated/prisma/internal/prismaNamespace.js").GlobalOmitConfig | undefined;
    }>;
    failJob(jobId: string, input: JobFailureInput): import("../generated/prisma/models.js").Prisma__ExportJobClient<{
        error: string | null;
        id: string;
        status: import("../generated/prisma/enums.js").ExportJobStatus;
        createdAt: Date;
        params: import("@prisma/client/runtime/client.js").JsonValue;
        vkUserId: number | null;
        okUserId: bigint | null;
        totalCount: number | null;
        fetchedCount: number;
        warning: string | null;
        xlsxPath: string | null;
        docxPath: string | null;
    }, never, import("@prisma/client/runtime/client.js").DefaultArgs, {
        omit: import("../generated/prisma/internal/prismaNamespace.js").GlobalOmitConfig | undefined;
    }>;
    saveFriendsBatch(jobId: string, records: FriendRecordInput[], batchSize?: number): Promise<number>;
    getFriendRecordPayloads(jobId: string): Promise<FriendRecordPayload[]>;
    getJobById(jobId: string): Promise<{
        okUserId: string | null;
        error: string | null;
        id: string;
        status: import("../generated/prisma/enums.js").ExportJobStatus;
        createdAt: Date;
        params: import("@prisma/client/runtime/client.js").JsonValue;
        vkUserId: number | null;
        totalCount: number | null;
        fetchedCount: number;
        warning: string | null;
        xlsxPath: string | null;
        docxPath: string | null;
    } | null>;
    getJobLogs(jobId: string, take?: number): Promise<never[]> | import("../generated/prisma/internal/prismaNamespace.js").PrismaPromise<{
        id: string;
        createdAt: Date;
        jobId: string;
        level: import("../generated/prisma/enums.js").JobLogLevel;
        message: string;
        meta: import("@prisma/client/runtime/client.js").JsonValue | null;
    }[]>;
    fetchUsersInfo(userIds: string[], options: {
        fields?: string[];
        emptyPictures?: boolean;
        onProgress?: (progress: {
            processed: number;
            total: number;
        }) => void;
        onLog?: (log: string) => void;
    }): Promise<OkUserInfo[]>;
}
