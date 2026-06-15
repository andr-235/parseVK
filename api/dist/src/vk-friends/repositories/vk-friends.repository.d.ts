import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma.service.js';
export type ExportJobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
export type JobLogLevel = 'info' | 'warn' | 'error';
export interface ExportJobCreateInput {
    params: unknown;
    vkUserId?: number | null;
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
    vkFriendId: number;
    payload: unknown;
}
export interface FriendRecordPayload {
    payload: unknown;
}
export declare class VkFriendsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createJob(input: ExportJobCreateInput): Prisma.Prisma__ExportJobClient<{
        error: string | null;
        id: string;
        status: import("../../generated/prisma/enums.js").ExportJobStatus;
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
        omit: Prisma.GlobalOmitConfig | undefined;
    }>;
    getJobById(jobId: string): Prisma.Prisma__ExportJobClient<{
        error: string | null;
        id: string;
        status: import("../../generated/prisma/enums.js").ExportJobStatus;
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
        omit: Prisma.GlobalOmitConfig | undefined;
    }>;
    getJobLogs(jobId: string, take?: number): Promise<never[]> | Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        jobId: string;
        level: import("../../generated/prisma/enums.js").JobLogLevel;
        message: string;
        meta: import("@prisma/client/runtime/client.js").JsonValue | null;
    }[]>;
    appendLogs(jobId: string, logs: JobLogInput[]): Promise<number>;
    setJobProgress(jobId: string, input: JobProgressUpdateInput): Prisma.Prisma__ExportJobClient<{
        error: string | null;
        id: string;
        status: import("../../generated/prisma/enums.js").ExportJobStatus;
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
        omit: Prisma.GlobalOmitConfig | undefined;
    }>;
    completeJob(jobId: string, input: JobCompletionInput): Prisma.Prisma__ExportJobClient<{
        error: string | null;
        id: string;
        status: import("../../generated/prisma/enums.js").ExportJobStatus;
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
        omit: Prisma.GlobalOmitConfig | undefined;
    }>;
    failJob(jobId: string, input: JobFailureInput): Prisma.Prisma__ExportJobClient<{
        error: string | null;
        id: string;
        status: import("../../generated/prisma/enums.js").ExportJobStatus;
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
        omit: Prisma.GlobalOmitConfig | undefined;
    }>;
    saveFriendsBatch(jobId: string, records: FriendRecordInput[], batchSize?: number): Promise<number>;
    getFriendRecordPayloads(jobId: string): Promise<FriendRecordPayload[]>;
    private normalizeBatchSize;
    private normalizeCount;
    private normalizeTake;
}
