import { Injectable } from '@nestjs/common';
import { Api } from 'telegram';
import { Prisma } from '@/generated/prisma/client';
import type { MemberRecord } from '../interfaces/telegram-client.interface';
import type { TelegramMemberDto } from '../dto/telegram-member.dto';
import bigInt, { type BigInteger } from 'big-integer';
import { TelegramMemberStatus } from '../types/telegram.enums';

export type TelegramUserRecord = {
  id: number;
  telegramId: bigint;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  phoneNumber: string | null;
  bio: string | null;
  languageCode: string | null;
  isBot: boolean;
  isPremium: boolean;
  deleted: boolean;
  restricted: boolean;
  verified: boolean;
  scam: boolean;
  fake: boolean;
  min: boolean;
  self: boolean;
  contact: boolean;
  mutualContact: boolean;
  accessHash: string | null;
  photoId: bigint | null;
  photoDcId: number | null;
  photoHasVideo: boolean;
  commonChatsCount: number | null;
  usernames: unknown;
  personal: unknown;
  botInfo: unknown;
  blocked: boolean;
  contactRequirePremium: boolean;
  spam: boolean;
  closeFriend: boolean;
};

export type TelegramChatMemberRecord = {
  status: TelegramMemberStatus;
  isAdmin: boolean;
  isOwner: boolean;
  joinedAt: Date | null;
  leftAt: Date | null;
};

@Injectable()
export class TelegramMemberMapper {
  mapChannelParticipantStatus(participant: Api.TypeChannelParticipant): {
    status: TelegramMemberStatus;
    isAdmin: boolean;
    isOwner: boolean;
    joinedAt: Date | null;
    leftAt: Date | null;
  } {
    if (participant instanceof Api.ChannelParticipantCreator) {
      return {
        status: TelegramMemberStatus.CREATOR,
        isAdmin: true,
        isOwner: true,
        joinedAt: null,
        leftAt: null,
      };
    }

    if (participant instanceof Api.ChannelParticipantAdmin) {
      return {
        status: TelegramMemberStatus.ADMINISTRATOR,
        isAdmin: true,
        isOwner: false,
        joinedAt: this.extractDate(
          (participant as { date?: number | bigint }).date,
        ),
        leftAt: null,
      };
    }

    if (participant instanceof Api.ChannelParticipantBanned) {
      const status = (participant as { left?: boolean }).left
        ? TelegramMemberStatus.LEFT
        : TelegramMemberStatus.RESTRICTED;
      return {
        status,
        isAdmin: false,
        isOwner: false,
        joinedAt: this.extractDate(
          (participant as { date?: number | bigint }).date,
        ),
        leftAt: this.extractDate(
          (participant as { bannedRights?: { untilDate?: unknown } })
            .bannedRights?.untilDate,
        ),
      };
    }

    if (participant instanceof Api.ChannelParticipantLeft) {
      return {
        status: TelegramMemberStatus.LEFT,
        isAdmin: false,
        isOwner: false,
        joinedAt: null,
        leftAt: null,
      };
    }

    return {
      status: TelegramMemberStatus.MEMBER,
      isAdmin: false,
      isOwner: false,
      joinedAt: this.extractDate(
        (participant as { date?: number | bigint }).date,
      ),
      leftAt: null,
    };
  }

  mapChatParticipantStatus(participant: Api.TypeChatParticipant): {
    status: TelegramMemberStatus;
    isAdmin: boolean;
    isOwner: boolean;
    joinedAt: Date | null;
    leftAt: Date | null;
  } {
    if (participant instanceof Api.ChatParticipantCreator) {
      return {
        status: TelegramMemberStatus.CREATOR,
        isAdmin: true,
        isOwner: true,
        joinedAt: null,
        leftAt: null,
      };
    }

    if (participant instanceof Api.ChatParticipantAdmin) {
      return {
        status: TelegramMemberStatus.ADMINISTRATOR,
        isAdmin: true,
        isOwner: false,
        joinedAt: this.extractDate(
          (participant as { date?: number | bigint }).date,
        ),
        leftAt: null,
      };
    }

    return {
      status: TelegramMemberStatus.MEMBER,
      isAdmin: false,
      isOwner: false,
      joinedAt: this.extractDate(
        (participant as { date?: number | bigint }).date,
      ),
      leftAt: null,
    };
  }

  buildMemberRecordFromChannel(
    user: Api.User,
    participant: Api.TypeChannelParticipant,
  ): MemberRecord {
    const meta = this.mapChannelParticipantStatus(participant);
    return {
      user,
      status: meta.status,
      isAdmin: meta.isAdmin,
      isOwner: meta.isOwner,
      joinedAt: meta.joinedAt,
      leftAt: meta.leftAt,
    };
  }

  buildMemberRecordFromChat(
    user: Api.User,
    participant: Api.TypeChatParticipant,
  ): MemberRecord {
    const meta = this.mapChatParticipantStatus(participant);
    return {
      user,
      status: meta.status,
      isAdmin: meta.isAdmin,
      isOwner: meta.isOwner,
      joinedAt: meta.joinedAt,
      leftAt: meta.leftAt,
    };
  }

  buildTelegramUserData(user: Api.User) {
    const photo =
      user.photo instanceof Api.UserProfilePhoto ? user.photo : null;
    const usernames = user.usernames?.length
      ? user.usernames.map((u) => ({
          username: u.username,
          active: u.active,
          editable: u.editable,
        }))
      : null;

    return {
      telegramId: this.toBigInt(user.id),
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      username: user.username ?? null,
      phoneNumber: user.phone ?? null,
      bio: null as string | null,
      languageCode: user.langCode ?? null,
      isBot: Boolean(user.bot),
      isPremium: Boolean(user.premium),
      deleted: Boolean(user.deleted),
      restricted: Boolean(user.restricted),
      verified: Boolean(user.verified),
      scam: Boolean(user.scam),
      fake: Boolean(user.fake),
      min: Boolean(user.min),
      self: Boolean(user.self),
      contact: Boolean(user.contact),
      mutualContact: Boolean(user.mutualContact),
      accessHash: user.accessHash ? user.accessHash.toString() : null,
      photoId: photo ? this.toBigInt(photo.photoId) : null,
      photoDcId: photo ? photo.dcId : null,
      photoHasVideo: photo ? Boolean(photo.hasVideo) : false,
      commonChatsCount:
        'commonChatsCount' in user && typeof user.commonChatsCount === 'number'
          ? user.commonChatsCount
          : null,
      usernames: usernames
        ? (JSON.parse(JSON.stringify(usernames)) as Prisma.InputJsonValue)
        : (Prisma.JsonNull as unknown as Prisma.InputJsonValue),
      personal: Prisma.JsonNull as unknown as Prisma.InputJsonValue,
      botInfo: Prisma.JsonNull as unknown as Prisma.InputJsonValue,
      blocked: false,
      contactRequirePremium: false,
      spam: false,
      closeFriend: false,
    };
  }

  mapToMemberDto(
    userRecord: TelegramUserRecord,
    member: TelegramChatMemberRecord,
  ): TelegramMemberDto {
    const usernames =
      userRecord.usernames &&
      typeof userRecord.usernames === 'object' &&
      Array.isArray(userRecord.usernames)
        ? (userRecord.usernames as Array<{
            username: string;
            active: boolean;
            editable: boolean;
          }>)
        : null;

    return {
      userId: (userRecord as { id: number }).id,
      telegramId: (userRecord as { telegramId: bigint }).telegramId.toString(),
      firstName: (userRecord as { firstName: string | null }).firstName,
      lastName: (userRecord as { lastName: string | null }).lastName,
      username: (userRecord as { username: string | null }).username,
      phoneNumber: (userRecord as { phoneNumber: string | null }).phoneNumber,
      bio: (userRecord as { bio: string | null }).bio,
      languageCode: (userRecord as { languageCode: string | null })
        .languageCode,
      isBot: (userRecord as { isBot: boolean }).isBot,
      isPremium: (userRecord as { isPremium: boolean }).isPremium,
      deleted: (userRecord as { deleted: boolean }).deleted,
      restricted: (userRecord as { restricted: boolean }).restricted,
      verified: (userRecord as { verified: boolean }).verified,
      scam: (userRecord as { scam: boolean }).scam,
      fake: (userRecord as { fake: boolean }).fake,
      min: (userRecord as { min: boolean }).min,
      self: (userRecord as { self: boolean }).self,
      contact: (userRecord as { contact: boolean }).contact,
      mutualContact: (userRecord as { mutualContact: boolean }).mutualContact,
      accessHash: (userRecord as { accessHash: string | null }).accessHash,
      photoId: (userRecord as { photoId: bigint | null }).photoId
        ? (userRecord as { photoId: bigint }).photoId.toString()
        : null,
      photoDcId: (userRecord as { photoDcId: number | null }).photoDcId,
      photoHasVideo: (userRecord as { photoHasVideo: boolean }).photoHasVideo,
      commonChatsCount: (userRecord as { commonChatsCount: number | null })
        .commonChatsCount,
      usernames,
      personal:
        (userRecord as { personal?: unknown }).personal &&
        typeof (userRecord as { personal?: unknown }).personal === 'object'
          ? ((userRecord as { personal: unknown })
              .personal as TelegramMemberDto['personal'])
          : null,
      botInfo:
        (userRecord as { botInfo?: unknown }).botInfo &&
        typeof (userRecord as { botInfo?: unknown }).botInfo === 'object'
          ? ((userRecord as { botInfo: unknown })
              .botInfo as TelegramMemberDto['botInfo'])
          : null,
      blocked: (userRecord as { blocked: boolean }).blocked,
      contactRequirePremium: (userRecord as { contactRequirePremium: boolean })
        .contactRequirePremium,
      spam: (userRecord as { spam: boolean }).spam,
      closeFriend: (userRecord as { closeFriend: boolean }).closeFriend,
      status: (member as { status: TelegramMemberStatus }).status,
      isAdmin: (member as { isAdmin: boolean }).isAdmin,
      isOwner: (member as { isOwner: boolean }).isOwner,
      joinedAt: (member as { joinedAt: Date | null }).joinedAt
        ? (member as { joinedAt: Date }).joinedAt.toISOString()
        : null,
      leftAt: (member as { leftAt: Date | null }).leftAt
        ? (member as { leftAt: Date }).leftAt.toISOString()
        : null,
    };
  }

  formatMemberStatus(status: TelegramMemberStatus): string {
    const statusMap: Record<string, string> = {
      CREATOR: 'Создатель',
      ADMINISTRATOR: 'Администратор',
      MEMBER: 'Участник',
      RESTRICTED: 'Ограничен',
      LEFT: 'Покинул',
      KICKED: 'Исключен',
    };
    return statusMap[status as string] ?? (status as string);
  }

  toBigInt(value: unknown): bigint {
    if (typeof value === 'bigint') {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return BigInt(Math.trunc(value));
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (/^-?\d+$/.test(trimmed)) {
        return BigInt(trimmed);
      }
    }
    if (
      value &&
      typeof (value as { toString?: () => string }).toString === 'function'
    ) {
      const stringValue = (value as { toString: () => string }).toString();
      if (/^-?\d+$/.test(stringValue)) {
        return BigInt(stringValue);
      }
    }
    throw new Error('Unable to convert value to bigint');
  }

  private extractDate(value: unknown): Date | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return new Date(value * 1000);
    }
    if (typeof value === 'bigint') {
      return new Date(Number(value) * 1000);
    }
    if (value && typeof value === 'object') {
      try {
        const parsed = this.toBigInt(value);
        return new Date(Number(parsed) * 1000);
      } catch {
        return null;
      }
    }
    return null;
  }

  toTelegramLong(value: unknown): BigInteger {
    if (value === undefined || value === null) {
      return bigInt.zero;
    }
    try {
      return bigInt(this.toBigInt(value).toString());
    } catch {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^-?\d+$/.test(trimmed)) {
          return bigInt(trimmed);
        }
      }
      return bigInt.zero;
    }
  }

  bigIntKey(value: unknown): string {
    return this.toBigInt(value).toString();
  }
}
