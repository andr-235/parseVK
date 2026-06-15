import { TelegramClient } from 'telegram';
import type { ResolvedChat, MemberRecord } from '../interfaces/telegram-client.interface.js';
import type { TelegramMemberDto } from '../dto/telegram-member.dto.js';
import { TelegramChatRepository } from '../repositories/telegram-chat.repository.js';
import { TelegramMemberRepository } from '../repositories/telegram-member.repository.js';
import { TelegramMemberMapper } from '../mappers/telegram-member.mapper.js';
import { PrismaService } from '../../prisma.service.js';
export declare class TelegramChatSyncService {
    private readonly chatRepository;
    private readonly memberRepository;
    private readonly memberMapper;
    private readonly prisma;
    private readonly logger;
    constructor(chatRepository: TelegramChatRepository, memberRepository: TelegramMemberRepository, memberMapper: TelegramMemberMapper, prisma: PrismaService);
    persistChat(resolved: ResolvedChat, members: MemberRecord[], client: TelegramClient, enrichWithFullData?: boolean): Promise<{
        chatId: number;
        telegramId: bigint;
        members: TelegramMemberDto[];
    }>;
    private enrichUserWithFullData;
    private stringifyError;
}
