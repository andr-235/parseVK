import type { Response } from 'express';
import { TelegramDlMatchService } from './telegram-dl-match.service.js';
import { TelegramDlMatchResultsQueryDto } from './dto/telegram-dl-match-results-query.dto.js';
import { TelegramDlMatchExcludedChatDto } from './dto/excluded-chat.dto.js';
export declare class TelegramDlMatchController {
    private readonly service;
    constructor(service: TelegramDlMatchService);
    createRun(): Promise<import("./dto/telegram-dl-match-response.dto.js").TelegramDlMatchRunDto>;
    getRuns(): Promise<import("./dto/telegram-dl-match-response.dto.js").TelegramDlMatchRunDto[]>;
    getRunById(id: string): Promise<import("./dto/telegram-dl-match-response.dto.js").TelegramDlMatchRunDto>;
    getResults(id: string, query: TelegramDlMatchResultsQueryDto): Promise<import("./dto/telegram-dl-match-response.dto.js").TelegramDlMatchResultDto[]>;
    getResultMessages(id: string, resultId: string): Promise<import("./dto/telegram-dl-match-response.dto.js").TelegramDlMatchResultMessagesGroupDto[]>;
    excludeChat(id: string, payload: TelegramDlMatchExcludedChatDto): Promise<import("./dto/telegram-dl-match-response.dto.js").TelegramDlMatchRunDto>;
    restoreChat(id: string, peerId: string): Promise<import("./dto/telegram-dl-match-response.dto.js").TelegramDlMatchRunDto>;
    exportRun(id: string, query: TelegramDlMatchResultsQueryDto, res: Response): Promise<void>;
}
