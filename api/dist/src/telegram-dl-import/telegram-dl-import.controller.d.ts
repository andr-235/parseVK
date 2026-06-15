import { TelegramDlImportService } from './telegram-dl-import.service.js';
import { TelegramDlImportFilesQueryDto } from './dto/telegram-dl-import-files-query.dto.js';
import { TelegramDlImportContactsQueryDto } from './dto/telegram-dl-import-contacts-query.dto.js';
export declare class TelegramDlImportController {
    private readonly service;
    constructor(service: TelegramDlImportService);
    uploadFiles(files: Express.Multer.File[]): Promise<import("./dto/telegram-dl-import-response.dto.js").TelegramDlImportUploadResponseDto>;
    getFiles(query: TelegramDlImportFilesQueryDto): Promise<import("./dto/telegram-dl-import-response.dto.js").TelegramDlImportFileDto[]>;
    getContacts(query: TelegramDlImportContactsQueryDto): Promise<{
        items: {
            id: string;
            importFileId: string;
            originalFileName: string;
            isActive: boolean;
            telegramId: string | null;
            username: string | null;
            phone: string | null;
            firstName: string | null;
            lastName: string | null;
            description: string | null;
            region: string | null;
            joinedAt: string | null;
            channelsRaw: string | null;
            fullName: string | null;
            address: string | null;
            vkUrl: string | null;
            email: string | null;
            telegramContact: string | null;
            instagram: string | null;
            viber: string | null;
            odnoklassniki: string | null;
            birthDateText: string | null;
            usernameExtra: string | null;
            geo: string | null;
            sourceRowIndex: number;
            createdAt: string;
        }[];
        total: number;
        limit: number;
        offset: number;
    }>;
}
