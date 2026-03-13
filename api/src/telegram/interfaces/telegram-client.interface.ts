import type { TelegramClient } from 'telegram';
import type { Api } from 'telegram';
import type {
  TelegramChatType,
  TelegramMemberStatus,
} from '../types/telegram.enums.js';

export interface ITelegramClient {
  getClient(): Promise<TelegramClient>;
  disconnect(): Promise<void>;
}

export type TelegramIdentifierKind =
  | 'username'
  | 'publicLink'
  | 'inviteLink'
  | 'numericId'
  | 'channelNumericId'
  | 'invalid';

export interface NormalizedTelegramIdentifier {
  raw: string;
  normalized: string;
  kind: TelegramIdentifierKind;
  numericTelegramId?: bigint;
  inviteHash?: string;
  username?: string;
  messageId?: number;
}

export interface ResolvedChat {
  telegramId: bigint;
  type: TelegramChatType;
  title: string | null;
  username: string | null;
  description: string | null;
  accessHash: string | null;
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

export interface DiscussionAuthorCollection {
  members: MemberRecord[];
  total: number | null;
  fetchedMessages: number;
  source: 'discussion_comments';
}

export interface ResolvedDiscussionTarget {
  identifier: NormalizedTelegramIdentifier;
  resolvedChat: ResolvedChat;
  mode: 'thread' | 'chatRange';
  messageId?: number;
}
