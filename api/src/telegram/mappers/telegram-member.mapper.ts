import { Injectable } from '@nestjs/common';
import { Api } from 'telegram';
import {
  TelegramMemberStatus,
  Prisma,
  type TelegramUser,
  type TelegramChatMember,
} from '@prisma/client';
import type { MemberRecord } from '../interfaces/telegram-client.interface';
import type { TelegramMemberDto } from '../dto/telegram-member.dto';
import bigInt, { type BigInteger } from 'big-integer';

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
      const status = participant.left
        ? TelegramMemberStatus.LEFT
        : TelegramMemberStatus.RESTRICTED;
      return {
        status,
        isAdmin: false,
        isOwner: false,
        joinedAt: this.extractDate(
          (participant as { date?: number | bigint }).date,
        ),
        leftAt: this.extractDate(participant.bannedRights?.untilDate),
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
        : Prisma.JsonNull,
      personal: Prisma.JsonNull,
      botInfo: Prisma.JsonNull,
      blocked: false,
      contactRequirePremium: false,
      spam: false,
      closeFriend: false,
    };
  }

  mapToMemberDto(
    userRecord: TelegramUser,
    member: TelegramChatMember,
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
      userId: userRecord.id,
      telegramId: userRecord.telegramId.toString(),
      firstName: userRecord.firstName,
      lastName: userRecord.lastName,
      username: userRecord.username,
      phoneNumber: userRecord.phoneNumber,
      bio: userRecord.bio,
      languageCode: userRecord.languageCode,
      isBot: userRecord.isBot,
      isPremium: userRecord.isPremium,
      deleted: userRecord.deleted,
      restricted: userRecord.restricted,
      verified: userRecord.verified,
      scam: userRecord.scam,
      fake: userRecord.fake,
      min: userRecord.min,
      self: userRecord.self,
      contact: userRecord.contact,
      mutualContact: userRecord.mutualContact,
      accessHash: userRecord.accessHash,
      photoId: userRecord.photoId ? userRecord.photoId.toString() : null,
      photoDcId: userRecord.photoDcId,
      photoHasVideo: userRecord.photoHasVideo,
      commonChatsCount: userRecord.commonChatsCount,
      usernames,
      personal:
        userRecord.personal && typeof userRecord.personal === 'object'
          ? (userRecord.personal as TelegramMemberDto['personal'])
          : null,
      botInfo:
        userRecord.botInfo && typeof userRecord.botInfo === 'object'
          ? (userRecord.botInfo as TelegramMemberDto['botInfo'])
          : null,
      blocked: userRecord.blocked,
      contactRequirePremium: userRecord.contactRequirePremium,
      spam: userRecord.spam,
      closeFriend: userRecord.closeFriend,
      status: member.status,
      isAdmin: member.isAdmin,
      isOwner: member.isOwner,
      joinedAt: member.joinedAt ? member.joinedAt.toISOString() : null,
      leftAt: member.leftAt ? member.leftAt.toISOString() : null,
    };
  }

  formatMemberStatus(status: TelegramMemberStatus): string {
    const statusMap: Record<TelegramMemberStatus, string> = {
      CREATOR: 'Создатель',
      ADMINISTRATOR: 'Администратор',
      MEMBER: 'Участник',
      RESTRICTED: 'Ограничен',
      LEFT: 'Покинул',
      KICKED: 'Исключен',
    };
    return statusMap[status] ?? status;
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
