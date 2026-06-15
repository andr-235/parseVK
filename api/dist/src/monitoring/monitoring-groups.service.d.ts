import { PrismaService } from '../prisma.service.js';
import { MonitorDatabaseService } from './monitor-database.service.js';
import type { MonitorGroupDto } from './dto/monitor-group.dto.js';
import type { MonitorGroupsDto } from './dto/monitor-groups.dto.js';
import type { CreateMonitorGroupDto } from './dto/create-monitor-group.dto.js';
import type { UpdateMonitorGroupDto } from './dto/update-monitor-group.dto.js';
import { MonitoringMessenger } from './types/monitoring-messenger.enum.js';
export declare class MonitoringGroupsService {
    private readonly prisma;
    private readonly monitorDb;
    private readonly logger;
    constructor(prisma: PrismaService, monitorDb: MonitorDatabaseService);
    private get monitoringGroup();
    getGroups(options?: {
        messenger?: MonitoringMessenger;
        search?: string;
        category?: string;
        sync?: boolean;
    }): Promise<MonitorGroupsDto>;
    createGroup(dto: CreateMonitorGroupDto): Promise<MonitorGroupDto>;
    updateGroup(id: number, dto: UpdateMonitorGroupDto): Promise<MonitorGroupDto>;
    deleteGroup(id: number): Promise<{
        success: boolean;
        id: number;
    }>;
    private syncExternalGroups;
}
