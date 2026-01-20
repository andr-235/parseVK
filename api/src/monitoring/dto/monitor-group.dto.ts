import type { MonitoringMessenger } from '../types/monitoring-messenger.enum';

export interface MonitorGroupDto {
  id: number;
  messenger: MonitoringMessenger;
  chatId: string;
  name: string;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}
