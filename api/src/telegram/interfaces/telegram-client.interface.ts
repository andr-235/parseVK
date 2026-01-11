import type { TelegramClient } from 'telegram';
import type { Api } from 'telegram';
import type {
  TelegramChatType,
  TelegramMemberStatus,
} from '../types/telegram.enums';

export interface ITelegramClient {
  getClient(): Promise<TelegramClient>;
  disconnect(): Promise<void>;
}

export interface ResolvedChat {
  telegramId: bigint;
  type: TelegramChatType;
  title: string | null;
  username: string | null;
  description: string | null;
  entity: Api.Channel | Api.Chat | Api.User;
  totalMembers: number | null;
}

export interface MemberRecord {
  user: Api.User;
  status: TelegramMemberStatus;
  isAdmin: boolean;
  isOwner: boolean;
  joinedAt: Date | null;
  leftAt: Date | null;
}

export interface ParticipantCollection {
  members: MemberRecord[];
  total: number | null;
}
