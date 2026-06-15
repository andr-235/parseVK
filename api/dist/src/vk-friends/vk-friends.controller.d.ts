import type { MessageEvent } from '@nestjs/common';
import type { Response } from 'express';
import { type Observable } from 'rxjs';
import { VkFriendsService } from './vk-friends.service.js';
import { VkFriendsExportRequestDto } from './dto/vk-friends.dto.js';
import { FriendsJobStreamService } from '../common/friends-export/services/friends-job-stream.service.js';
import { VkFriendsExportJobService } from './services/vk-friends-export-job.service.js';
import { VkFriendsFileService } from './services/vk-friends-file.service.js';
export declare class VkFriendsController {
    private readonly vkFriendsService;
    private readonly exportJobService;
    private readonly fileService;
    private readonly jobStream;
    private readonly logger;
    constructor(vkFriendsService: VkFriendsService, exportJobService: VkFriendsExportJobService, fileService: VkFriendsFileService, jobStream: FriendsJobStreamService);
    export(body: VkFriendsExportRequestDto): Promise<{
        jobId: string;
        status: import("../generated/prisma/enums.js").ExportJobStatus;
    }>;
    getJob(jobId: string): Promise<{
        job: {
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
        };
        logs: never[] | {
            id: string;
            createdAt: Date;
            jobId: string;
            level: import("../generated/prisma/enums.js").JobLogLevel;
            message: string;
            meta: import("@prisma/client/runtime/client.js").JsonValue | null;
        }[];
    }>;
    downloadXlsx(jobId: string, res: Response): Promise<void>;
    streamJob(jobId: string): Observable<MessageEvent>;
    private toDoneEvent;
}
