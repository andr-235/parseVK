export declare const DEFAULT_DL_CONTACTS_LIMIT = 100;
export declare const MAX_DL_CONTACTS_LIMIT = 500;
export declare class TelegramDlImportContactsQueryDto {
    fileName?: string;
    telegramId?: string;
    username?: string;
    phone?: string;
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
}
