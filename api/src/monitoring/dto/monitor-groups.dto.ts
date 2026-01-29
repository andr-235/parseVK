import type { MonitorGroupDto } from './monitor-group.dto.js';

export interface MonitorGroupsDto {
  items: MonitorGroupDto[];
  total: number;
}
