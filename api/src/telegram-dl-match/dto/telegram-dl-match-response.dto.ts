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
  user: Record<string, unknown> | null;
  createdAt: string;
}
