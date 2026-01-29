import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MonitoringGroupsService } from './monitoring-groups.service.js';
import type { MonitorGroupDto } from './dto/monitor-group.dto.js';
import type { MonitorGroupsDto } from './dto/monitor-groups.dto.js';
import { CreateMonitorGroupDto } from './dto/create-monitor-group.dto.js';
import { UpdateMonitorGroupDto } from './dto/update-monitor-group.dto.js';
import { MonitorGroupsQueryDto } from './dto/monitor-groups-query.dto.js';
import { MonitorGroupIdParamDto } from './dto/monitor-group-id-param.dto.js';

@Controller('monitoring/groups')
export class MonitoringGroupsController {
  constructor(
    private readonly monitoringGroupsService: MonitoringGroupsService,
  ) {}

  @Get()
  async getGroups(
    @Query() query: MonitorGroupsQueryDto,
  ): Promise<MonitorGroupsDto> {
    return this.monitoringGroupsService.getGroups({
      messenger: query.messenger,
      search: query.search,
      category: query.category,
      sync: query.sync,
    });
  }

  @Post()
  async createGroup(
    @Body() dto: CreateMonitorGroupDto,
  ): Promise<MonitorGroupDto> {
    return this.monitoringGroupsService.createGroup(dto);
  }

  @Patch(':id')
  async updateGroup(
    @Param() params: MonitorGroupIdParamDto,
    @Body() dto: UpdateMonitorGroupDto,
  ): Promise<MonitorGroupDto> {
    return this.monitoringGroupsService.updateGroup(params.id, dto);
  }

  @Delete(':id')
  async deleteGroup(
    @Param() params: MonitorGroupIdParamDto,
  ): Promise<{ success: boolean; id: number }> {
    return this.monitoringGroupsService.deleteGroup(params.id);
  }
}
