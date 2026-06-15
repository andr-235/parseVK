import { type TelegramClient } from 'telegram';
import type { DiscussionAuthorCollection, ResolvedDiscussionTarget } from '../interfaces/telegram-client.interface.js';
export interface DiscussionAuthorCollectOptions {
    dateFrom?: string;
    dateTo?: string;
    messageLimit?: number;
    authorLimit?: number;
}
export declare class TelegramCommentAuthorCollectorService {
    collectAuthors(client: TelegramClient, target: ResolvedDiscussionTarget, options: DiscussionAuthorCollectOptions): Promise<DiscussionAuthorCollection>;
    private collectThreadAuthors;
    private collectHistoryAuthors;
    private extractUniqueAuthors;
    private buildUsersMap;
    private extractUserId;
    private buildMemberRecord;
}
