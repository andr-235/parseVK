import type { MonitorGroupDto } from './monitor-group.dto';

export interface MonitorGroupsDto {
  items: MonitorGroupDto[];
  total: number;
}
