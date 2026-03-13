import type { TgmbaseQueryType } from '../utils/normalize-tgmbase-query.util.js';

export type TgmbaseSearchStatus =
  | 'found'
  | 'not_found'
  | 'ambiguous'
  | 'invalid'
  | 'error';

export type TgmbasePeerType = 'group' | 'supergroup' | 'channel' | 'unknown';

export interface TgmbaseProfileDto {
  id: string;
  telegramId: string;
  username: string | null;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  bot: boolean;
  scam: boolean;
  premium: boolean;
  updatedAt: string | null;
}

export interface TgmbaseCandidateDto {
  telegramId: string;
  username: string | null;
  phoneNumber: string | null;
  fullName: string;
}

export interface TgmbasePeerDto {
  peerId: string;
  title: string;
  username: string | null;
  type: TgmbasePeerType;
  participantsCount: number | null;
  region: number | null;
}

export interface TgmbaseContactDto {
  telegramId: string;
  username: string | null;
  phoneNumber: string | null;
  fullName: string;
  commonPeersCount: number;
  messageCount: number;
}

export interface TgmbaseMessageDto {
  id: string;
  messageId: string;
  peerId: string;
  peerTitle: string | null;
  peerType: TgmbasePeerType;
  date: string;
  text: string | null;
  fromId: string | null;
  replyTo: string | null;
  hasMedia: boolean;
  hasKeywords: boolean;
}

export interface TgmbaseMessagesPageDto {
  items: TgmbaseMessageDto[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface TgmbaseSearchItemDto {
  query: string;
  normalizedQuery: string;
  queryType: TgmbaseQueryType;
  status: TgmbaseSearchStatus;
  profile: TgmbaseProfileDto | null;
  candidates: TgmbaseCandidateDto[];
  groups: TgmbasePeerDto[];
  contacts: TgmbaseContactDto[];
  messagesPage: TgmbaseMessagesPageDto;
  stats: {
    groups: number;
    contacts: number;
    messages: number;
  };
  error: string | null;
}

export interface TgmbaseSearchSummaryDto {
  total: number;
  found: number;
  notFound: number;
  ambiguous: number;
  invalid: number;
  error: number;
}

export interface TgmbaseSearchResponseDto {
  summary: TgmbaseSearchSummaryDto;
  items: TgmbaseSearchItemDto[];
}
