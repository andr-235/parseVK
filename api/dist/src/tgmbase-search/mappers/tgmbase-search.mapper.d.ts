import type { channel, group, supergroup, user } from '../../generated/tgmbase/client.js';
import type { TgmbaseCandidateDto, TgmbaseMessageDto, TgmbasePeerDto, TgmbasePeerType, TgmbaseProfileDto } from '../dto/tgmbase-search-response.dto.js';
type TgmbasePeerRecord = channel | group | supergroup;
export declare class TgmbaseSearchMapper {
    toProfileDto(record: user): TgmbaseProfileDto;
    toCandidateDto(record: user): TgmbaseCandidateDto;
    toPeerDto(peerId: bigint, type: TgmbasePeerType, record?: TgmbasePeerRecord): TgmbasePeerDto;
    toMessageDto(message: {
        id: bigint;
        message_id: bigint;
        peer_id: bigint;
        date: Date;
        message: string | null;
        from_id: bigint | null;
        reply_to: bigint | null;
        media: boolean | null;
        keywords: string | null;
    }, peerMap: Map<string, TgmbasePeerDto>): TgmbaseMessageDto;
}
export {};
