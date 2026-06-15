import type { Params, Responses } from 'vk-io';
import { VkApiService } from './vk-api.service.js';
import { VkFriendsRepository, type ExportJobCreateInput, type FriendRecordInput, type JobCompletionInput, type JobFailureInput, type JobLogInput, type JobProgressUpdateInput, type FriendRecordPayload } from './repositories/vk-friends.repository.js';
export interface VkFriendsStatusResponse {
    status: 'ok';
}
import type { FetchAllFriendsProgress, FetchAllFriendsOptions, FetchAllFriendsResult as BaseFetchAllFriendsResult } from '../common/friends-export/interfaces/friends-export.interfaces.js';
export type { FetchAllFriendsProgress, FetchAllFriendsOptions };
export type FetchAllFriendsResult = BaseFetchAllFriendsResult<VkFriendItem>;
type VkFriendItem = Responses.FriendsGetResponse['items'][number];
export declare class VkFriendsService {
    private readonly vkApiService;
    private readonly repository;
    constructor(vkApiService: VkApiService, repository: VkFriendsRepository);
    getStatus(): VkFriendsStatusResponse;
    fetchAllFriends(params: Params.FriendsGetParams, options: FetchAllFriendsOptions): Promise<FetchAllFriendsResult>;
    private normalizePageSize;
    private normalizeLimit;
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
    getJobById(jobId: string): import("../generated/prisma/models.js").Prisma__ExportJobClient<{
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
    } | null, null, import("@prisma/client/runtime/client.js").DefaultArgs, {
        omit: import("../generated/prisma/internal/prismaNamespace.js").GlobalOmitConfig | undefined;
    }>;
    getJobLogs(jobId: string, take?: number): Promise<never[]> | import("../generated/prisma/internal/prismaNamespace.js").PrismaPromise<{
        id: string;
        createdAt: Date;
        jobId: string;
        level: import("../generated/prisma/enums.js").JobLogLevel;
        message: string;
        meta: import("@prisma/client/runtime/client.js").JsonValue | null;
    }[]>;
}
