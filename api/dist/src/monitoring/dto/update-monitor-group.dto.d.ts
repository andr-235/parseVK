import { MonitoringMessenger } from '../types/monitoring-messenger.enum.js';
export declare class UpdateMonitorGroupDto {
    chatId?: string;
    name?: string;
    category?: string | null;
    messenger?: MonitoringMessenger;
}
