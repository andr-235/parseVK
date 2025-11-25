import { Injectable } from '@nestjs/common';
import { Api } from 'telegram';
import { TelegramChatType } from '@prisma/client';
import type { ResolvedChat } from '../interfaces/telegram-client.interface';

@Injectable()
export class TelegramChatMapper {
  resolveChat(entity: unknown): ResolvedChat | null {
    if (entity instanceof Api.Channel) {
      const type = entity.megagroup
        ? TelegramChatType.SUPERGROUP
        : TelegramChatType.CHANNEL;
      return {
        telegramId: this.toBigInt(entity.id),
        type,
        title: entity.title ?? null,
        username: entity.username ?? null,
        description: null,
        entity,
        totalMembers:
          typeof entity.participantsCount === 'number'
            ? entity.participantsCount
            : null,
      };
    }

    if (entity instanceof Api.Chat) {
      return {
        telegramId: this.toBigInt(entity.id),
        type: TelegramChatType.GROUP,
        title: entity.title ?? null,
        username: null,
        description: null,
        entity,
        totalMembers:
          typeof entity.participantsCount === 'number'
            ? entity.participantsCount
            : null,
      };
    }

    if (entity instanceof Api.User) {
      return {
        telegramId: this.toBigInt(entity.id),
        type: TelegramChatType.PRIVATE,
        title: this.composeUserTitle(entity),
        username: entity.username ?? null,
        description: null,
        entity,
        totalMembers: 1,
      };
    }

    return null;
  }

  private composeUserTitle(user: Api.User): string | null {
    const parts = [user.firstName, user.lastName].filter(
      (value): value is string => Boolean(value && value.trim().length > 0),
    );
    if (parts.length === 0) {
      return user.username ?? null;
    }
    return parts.join(' ').trim();
  }

  private toBigInt(value: unknown): bigint {
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
}

