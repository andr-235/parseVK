import type { TelegramDlMatchResultDto, TelegramDlMatchResultMessagesGroupDto } from './dto/telegram-dl-match-response.dto.js';
export declare class TelegramDlMatchExporter {
    exportRun(runId: string, results: TelegramDlMatchResultDto[], messagesByResultId: Map<string, TelegramDlMatchResultMessagesGroupDto[]>): Promise<Buffer>;
}
