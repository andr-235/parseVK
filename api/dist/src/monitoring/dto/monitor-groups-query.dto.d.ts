import { MonitoringMessenger } from '../types/monitoring-messenger.enum.js';
export declare class MonitorGroupsQueryDto {
    messenger?: MonitoringMessenger;
    search?: string;
    category?: string;
    sync?: boolean;
}
