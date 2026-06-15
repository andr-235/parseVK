import { TelegramClient } from 'telegram';
import type { ResolvedChat, ParticipantCollection } from '../interfaces/telegram-client.interface.js';
import { TelegramMemberMapper } from '../mappers/telegram-member.mapper.js';
export declare class TelegramParticipantCollectorService {
    private readonly memberMapper;
    constructor(memberMapper: TelegramMemberMapper);
    collectParticipants(client: TelegramClient, resolved: ResolvedChat, limit: number): Promise<ParticipantCollection>;
    private collectChannelParticipants;
    private collectChatParticipants;
    private collectPrivateParticipant;
    private buildUsersMap;
    private extractChannelParticipantUserKey;
    private extractChatParticipantUserKey;
    private extractPeerUserKey;
    private bigIntKey;
    private toTelegramLong;
}
