import { MonitoringMessenger } from '../types/monitoring-messenger.enum.js';
export declare class CreateMonitorGroupDto {
    chatId: string;
    name: string;
    category?: string | null;
    messenger: MonitoringMessenger;
}
