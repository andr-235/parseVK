import { MonitoringGroupsService } from './monitoring-groups.service.js';
import type { MonitorGroupDto } from './dto/monitor-group.dto.js';
import type { MonitorGroupsDto } from './dto/monitor-groups.dto.js';
import { CreateMonitorGroupDto } from './dto/create-monitor-group.dto.js';
import { UpdateMonitorGroupDto } from './dto/update-monitor-group.dto.js';
import { MonitorGroupsQueryDto } from './dto/monitor-groups-query.dto.js';
import { MonitorGroupIdParamDto } from './dto/monitor-group-id-param.dto.js';
export declare class MonitoringGroupsController {
    private readonly monitoringGroupsService;
    constructor(monitoringGroupsService: MonitoringGroupsService);
    getGroups(query: MonitorGroupsQueryDto): Promise<MonitorGroupsDto>;
    createGroup(dto: CreateMonitorGroupDto): Promise<MonitorGroupDto>;
    updateGroup(params: MonitorGroupIdParamDto, dto: UpdateMonitorGroupDto): Promise<MonitorGroupDto>;
    deleteGroup(params: MonitorGroupIdParamDto): Promise<{
        success: boolean;
        id: number;
    }>;
}
