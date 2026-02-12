/**
 * Общие интерфейсы для экспорта друзей (VK и OK.ru).
 *
 * Используется обоими модулями: vk-friends и ok-friends.
 */

export interface FetchAllFriendsProgress {
  fetchedCount: number;
  totalCount: number;
  limitApplied: boolean;
}

export interface FetchAllFriendsOptions {
  pageSize?: number;
  onProgress?: (progress: FetchAllFriendsProgress) => void;
  onLog?: (log: string) => void;
}

/** @template T - тип элементов в rawItems (VK: объект пользователя; OK: строка userId) */
export interface FetchAllFriendsResult<T = unknown> {
  totalCount: number;
  fetchedCount: number;
  warning?: string;
  rawItems: T[];
}

export type ExportJobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
export type JobLogLevel = 'info' | 'warn' | 'error';

export interface ExportJobCreateInput {
  params: unknown;
  status?: ExportJobStatus;
  totalCount?: number | null;
  fetchedCount?: number;
  warning?: string | null;
  error?: string | null;
  xlsxPath?: string | null;
  docxPath?: string | null;
}

export interface JobLogInput {
  level: JobLogLevel;
  message: string;
  meta?: unknown;
}

export interface JobProgressUpdateInput {
  fetchedCount: number;
  totalCount?: number | null;
  warning?: string | null;
  status?: ExportJobStatus;
}

export interface JobCompletionInput {
  fetchedCount: number;
  totalCount?: number | null;
  warning?: string | null;
  xlsxPath?: string | null;
  docxPath?: string | null;
}

export interface JobFailureInput {
  error: string;
  fetchedCount?: number;
  totalCount?: number | null;
  warning?: string | null;
}

export interface FriendRecordInput {
  /** ID друга — number для VK, string для OK */
  friendId: number | string;
  payload: unknown;
}

export interface FriendRecordPayload {
  payload: unknown;
}

export type FriendsStreamEventType = 'progress' | 'log' | 'done' | 'error';
