import { Body, Controller, Get, Post } from '@nestjs/common';
import { TaskAutomationService } from './task-automation.service.js';
import { UpdateTaskAutomationSettingsDto } from './dto/update-task-automation-settings.dto.js';
import type {
  TaskAutomationRunResponse,
  TaskAutomationSettingsResponse,
} from './task-automation.interface.js';

@Controller('tasks/automation')
export class TaskAutomationController {
  constructor(private readonly automationService: TaskAutomationService) {}

  @Get('settings')
  async getSettings(): Promise<TaskAutomationSettingsResponse> {
    return this.automationService.getSettings();
  }

  @Post('settings')
  async updateSettings(
    @Body() dto: UpdateTaskAutomationSettingsDto,
  ): Promise<TaskAutomationSettingsResponse> {
    return this.automationService.updateSettings(dto);
  }

  @Post('run')
  async triggerRun(): Promise<TaskAutomationRunResponse> {
    return this.automationService.triggerManualRun();
  }
}
