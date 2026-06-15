import type { MessageEvent } from '@nestjs/common';
import type { Response } from 'express';
import { type Observable } from 'rxjs';
import { OkFriendsService } from './ok-friends.service.js';
import { OkFriendsExportRequestDto } from './dto/ok-friends.dto.js';
import { FriendsJobStreamService } from '../common/friends-export/services/friends-job-stream.service.js';
import { OkFriendsExportJobService } from './services/ok-friends-export-job.service.js';
import { OkFriendsFileService } from './services/ok-friends-file.service.js';
export declare class OkFriendsController {
    private readonly okFriendsService;
    private readonly exportJobService;
    private readonly fileService;
    private readonly jobStream;
    private readonly logger;
    constructor(okFriendsService: OkFriendsService, exportJobService: OkFriendsExportJobService, fileService: OkFriendsFileService, jobStream: FriendsJobStreamService);
    export(body: OkFriendsExportRequestDto): Promise<{
        jobId: string;
        status: import("../generated/prisma/enums.js").ExportJobStatus;
    }>;
    getJob(jobId: string): Promise<{
        job: {
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
