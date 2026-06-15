import { TelegramService } from './telegram.service.js';
import { SyncTelegramChatDto } from './dto/sync-telegram-chat.dto.js';
import { TelegramSyncResultDto } from './dto/telegram-sync-result.dto.js';
import { TelegramDiscussionSyncDto } from './dto/telegram-discussion-sync.dto.js';
import { TelegramDiscussionResultDto } from './dto/telegram-discussion-result.dto.js';
import type { Response } from 'express';
export declare class TelegramController {
    private readonly telegramService;
    constructor(telegramService: TelegramService);
    syncChat(payload: SyncTelegramChatDto): Promise<TelegramSyncResultDto>;
    syncDiscussionAuthors(payload: TelegramDiscussionSyncDto): Promise<TelegramDiscussionResultDto>;
    exportChat(chatId: number, res: Response): Promise<void>;
}
