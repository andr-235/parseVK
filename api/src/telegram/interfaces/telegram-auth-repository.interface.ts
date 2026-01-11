export type TelegramSettingsRecord = {
  id: number;
  phoneNumber: string | null;
  apiId: number | null;
  apiHash: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TelegramSettingsUpdate = {
  phoneNumber?: string | null;
  apiId?: number | null;
  apiHash?: string | null;
};

export type TelegramSessionRecord = {
  id: number;
  session: string;
  userId: number | null;
  username: string | null;
  phoneNumber: string | null;
  updatedAt: Date;
};

export type TelegramSessionCreate = {
  session: string;
  userId: number | null;
  username: string | null;
  phoneNumber: string | null;
};

export interface ITelegramAuthRepository {
  findLatestSettings(): Promise<TelegramSettingsRecord | null>;
  upsertSettings(data: TelegramSettingsUpdate): Promise<TelegramSettingsRecord>;
  findLatestSession(): Promise<TelegramSessionRecord | null>;
  replaceSession(data: TelegramSessionCreate): Promise<void>;
  deleteAllSessions(): Promise<number>;
}
