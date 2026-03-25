export interface TelegramDlMatchRunDto {
  id: string;
  status: string;
  contactsTotal: number;
  matchesTotal: number;
  strictMatchesTotal: number;
  usernameMatchesTotal: number;
  phoneMatchesTotal: number;
  createdAt?: string;
  finishedAt?: string | null;
  error?: string | null;
}

export interface TelegramDlMatchResultDto {
  id: string;
  runId: string;
  dlContactId: string;
  tgmbaseUserId: string | null;
  strictTelegramIdMatch: boolean;
  usernameMatch: boolean;
  phoneMatch: boolean;
  dlContact: Record<string, unknown>;
  user:
    | (Record<string, unknown> & {
        relatedChats?: Array<{
          type: 'group' | 'supergroup' | 'channel';
          peer_id: string;
          title: string;
        }>;
      })
    | null;
  createdAt: string;
}
