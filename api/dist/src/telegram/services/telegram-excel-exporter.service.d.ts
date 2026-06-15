import { TelegramChatRepository } from '../repositories/telegram-chat.repository.js';
import { TelegramMemberMapper } from '../mappers/telegram-member.mapper.js';
export declare class TelegramExcelExporterService {
    private readonly chatRepository;
    private readonly memberMapper;
    constructor(chatRepository: TelegramChatRepository, memberMapper: TelegramMemberMapper);
    exportChatToExcel(chatId: number): Promise<Buffer>;
}
