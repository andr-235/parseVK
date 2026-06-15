import { TgmbasePrismaService } from '../tgmbase-prisma/tgmbase-prisma.service.js';
import type { TelegramDlMatchResultDto, TelegramDlMatchResultMessagesGroupDto, TelegramDlMatchRunDto } from './dto/telegram-dl-match-response.dto.js';
import type { TelegramDlMatchResultsQueryDto } from './dto/telegram-dl-match-results-query.dto.js';
import { TelegramDlMatchExporter } from './telegram-dl-match.exporter.js';
import { TelegramDlMatchQueueProducer } from './queues/telegram-dl-match.queue.js';
export declare class TelegramDlMatchService {
    private readonly prisma;
    private readonly exporter;
    private readonly queue;
    private readonly logger;
    private batchSize;
    constructor(prisma: TgmbasePrismaService, exporter: TelegramDlMatchExporter, queue: TelegramDlMatchQueueProducer);
    createRun(): Promise<TelegramDlMatchRunDto>;
    processRun(runId: string | bigint): Promise<TelegramDlMatchRunDto>;
    getRuns(): Promise<TelegramDlMatchRunDto[]>;
    getRunById(id: string): Promise<TelegramDlMatchRunDto>;
    getResults(runId: string, query?: TelegramDlMatchResultsQueryDto): Promise<TelegramDlMatchResultDto[]>;
    getResultMessages(runId: string, resultId: string): Promise<TelegramDlMatchResultMessagesGroupDto[]>;
    excludeChat(runId: string, peerId: string): Promise<TelegramDlMatchRunDto>;
    restoreChat(runId: string, peerId: string): Promise<TelegramDlMatchRunDto>;
    exportRun(runId: string, query: TelegramDlMatchResultsQueryDto): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        fileName: string;
        run: TelegramDlMatchRunDto;
    }>;
    private buildResults;
    private findMatches;
    private normalizeTelegramId;
    private buildDlContactSnapshot;
    private buildUserSnapshot;
    private loadChatActivityByUserIds;
    private persistResults;
    private updateExcludedChatState;
    private loadActiveMessagesByResultIds;
    private mapRun;
    private mapResult;
}
