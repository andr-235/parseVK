import type { MonitorMessageDto } from './monitor-message.dto';

export interface MonitorMessagesDto {
  items: MonitorMessageDto[];
  total: number;
  usedKeywords: string[];
  lastSyncAt: string;
  page: number;
  limit: number;
  hasMore: boolean;
}
