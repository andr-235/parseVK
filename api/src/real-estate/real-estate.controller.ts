import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { RealEstateSchedulerService } from './real-estate-scheduler.service';
import type {
  RealEstateManualRunResponse,
  RealEstateScheduleSettingsResponse,
} from './real-estate-schedule.interface';
import { UpdateRealEstateScheduleSettingsDto } from './dto/update-real-estate-schedule-settings.dto';

@Controller('real-estate/schedule')
export class RealEstateController {
  constructor(private readonly scheduler: RealEstateSchedulerService) {}

  @Get()
  getSettings(): Promise<RealEstateScheduleSettingsResponse> {
    return this.scheduler.getSettings();
  }

  @Put()
  updateSettings(
    @Body() dto: UpdateRealEstateScheduleSettingsDto,
  ): Promise<RealEstateScheduleSettingsResponse> {
    return this.scheduler.updateSettings(dto);
  }

  @Post('run')
  @HttpCode(200)
  triggerRun(): Promise<RealEstateManualRunResponse> {
    return this.scheduler.triggerManualRun();
  }
}
