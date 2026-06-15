import type { TelegramClient } from 'telegram';
import { TelegramChatMapper } from '../mappers/telegram-chat.mapper.js';
import { TelegramIdentifierResolverService } from './telegram-identifier-resolver.service.js';
import type { ResolvedDiscussionTarget } from '../interfaces/telegram-client.interface.js';
import type { SyncDiscussionAuthorsParams } from '../types/telegram-sync.types.js';
export declare class TelegramDiscussionResolverService {
    private readonly identifierResolver;
    private readonly chatMapper;
    constructor(identifierResolver: TelegramIdentifierResolverService, chatMapper: TelegramChatMapper);
    resolve(client: TelegramClient, params: Pick<SyncDiscussionAuthorsParams, 'identifier' | 'mode' | 'messageId'>): Promise<ResolvedDiscussionTarget>;
}
