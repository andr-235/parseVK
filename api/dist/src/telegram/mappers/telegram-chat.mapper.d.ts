import type { ResolvedChat } from '../interfaces/telegram-client.interface.js';
export declare class TelegramChatMapper {
    resolveChat(entity: unknown): ResolvedChat | null;
    private composeUserTitle;
    private toBigInt;
}
