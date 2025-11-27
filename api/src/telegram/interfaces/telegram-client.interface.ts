import type { TelegramClient } from 'telegram';
import type { Api } from 'telegram';
import { TelegramChatType, TelegramMemberStatus } from '@prisma/client';

export interface ITelegramClient {
  getClient(): Promise<TelegramClient>;
  disconnect(): Promise<void>;
}

export interface ResolvedChat {
  telegramId: bigint;
  type: TelegramChatType | string;
  title: string | null;
  username: string | null;
  description: string | null;
  entity: Api.Channel | Api.Chat | Api.User;
  totalMembers: number | null;
}

export interface MemberRecord {
  user: Api.User;
  status: TelegramMemberStatus | string;
  isAdmin: boolean;
  isOwner: boolean;
  joinedAt: Date | null;
  leftAt: Date | null;
}

export interface ParticipantCollection {
  members: MemberRecord[];
  total: number | null;
}

