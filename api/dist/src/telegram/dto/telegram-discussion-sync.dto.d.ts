export declare class TelegramDiscussionSyncDto {
    identifier: string;
    mode: 'thread' | 'chatRange';
    messageId?: number;
    dateFrom?: string;
    dateTo?: string;
    messageLimit?: number;
    authorLimit?: number;
}
