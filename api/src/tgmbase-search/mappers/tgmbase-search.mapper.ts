import { Injectable } from '@nestjs/common';
import type {
  channel,
  group,
  supergroup,
  user,
} from '../../generated/tgmbase/client.js';
import type {
  TgmbaseCandidateDto,
  TgmbaseMessageDto,
  TgmbasePeerDto,
  TgmbasePeerType,
  TgmbaseProfileDto,
} from '../dto/tgmbase-search-response.dto.js';

type TgmbasePeerRecord = channel | group | supergroup;

const hasUsername = (
  record: TgmbasePeerRecord | undefined,
): record is channel | supergroup => {
  return Boolean(record && 'username' in record);
};

@Injectable()
export class TgmbaseSearchMapper {
  toProfileDto(record: user): TgmbaseProfileDto {
    const firstName = record.first_name?.trim() ?? null;
    const lastName = record.last_name?.trim() ?? null;
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    return {
      id: record.id.toString(),
      telegramId: record.user_id.toString(),
      username: record.username ?? null,
      phoneNumber: record.phone ?? null,
      firstName,
      lastName,
      fullName: fullName || record.username || record.user_id.toString(),
      bot: record.bot,
      scam: record.scam,
      premium: record.premium,
      updatedAt: record.upd_date?.toISOString() ?? null,
    };
  }

  toCandidateDto(record: user): TgmbaseCandidateDto {
    const profile = this.toProfileDto(record);

    return {
      telegramId: profile.telegramId,
      username: profile.username,
      phoneNumber: profile.phoneNumber,
      fullName: profile.fullName,
    };
  }

  toPeerDto(
    peerId: bigint,
    type: TgmbasePeerType,
    record?: TgmbasePeerRecord,
  ): TgmbasePeerDto {
    return {
      peerId: peerId.toString(),
      title: record?.title ?? peerId.toString(),
      username: hasUsername(record) ? (record.username ?? null) : null,
      type,
      participantsCount:
        record?.participants_count != null
          ? Number(record.participants_count)
          : null,
      region: record?.region ?? null,
    };
  }

  toMessageDto(
    message: {
      id: bigint;
      message_id: bigint;
      peer_id: bigint;
      date: Date;
      message: string | null;
      from_id: bigint | null;
      reply_to: bigint | null;
      media: boolean | null;
      keywords: string | null;
    },
    peerMap: Map<string, TgmbasePeerDto>,
  ): TgmbaseMessageDto {
    const peer = peerMap.get(message.peer_id.toString());

    return {
      id: message.id.toString(),
      messageId: message.message_id.toString(),
      peerId: message.peer_id.toString(),
      peerTitle: peer?.title ?? null,
      peerType: peer?.type ?? 'unknown',
      date: message.date.toISOString(),
      text: message.message,
      fromId: message.from_id?.toString() ?? null,
      replyTo: message.reply_to?.toString() ?? null,
      hasMedia: Boolean(message.media),
      hasKeywords: Boolean(message.keywords),
    };
  }
}
