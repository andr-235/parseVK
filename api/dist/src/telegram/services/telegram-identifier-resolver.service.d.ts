import { type TelegramClient } from 'telegram';
import type { NormalizedTelegramIdentifier } from '../interfaces/telegram-client.interface.js';
import { TelegramChatRepository } from '../repositories/telegram-chat.repository.js';
interface ResolvedTelegramEntity {
    identifier: NormalizedTelegramIdentifier;
    entity: unknown;
}
export declare class TelegramIdentifierResolverService {
    private readonly chatRepository;
    constructor(chatRepository: TelegramChatRepository);
    resolve(client: TelegramClient, rawIdentifier: string): Promise<ResolvedTelegramEntity>;
    private resolveByNumericId;
    private tryResolveDirectlyByNumericId;
}
export {};
