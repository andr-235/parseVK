export interface SyncChatParams {
  identifier: string;
  limit?: number;
  enrichWithFullData?: boolean;
}

export interface SyncDiscussionAuthorsParams {
  identifier: string;
  mode: 'thread' | 'chatRange';
  messageId?: number;
  dateFrom?: string;
  dateTo?: string;
  messageLimit?: number;
  authorLimit?: number;
}
