import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma.service';
import { RealEstateScraperService } from './real-estate.scraper.service';
import type {
  RealEstateManualRunResponse,
  RealEstateScheduleSettings,
  RealEstateScheduleSettingsResponse,
} from './real-estate-schedule.interface';
import { UpdateRealEstateScheduleSettingsDto } from './dto/update-real-estate-schedule-settings.dto';

const DEFAULT_LOOKBACK_HOURS = 24;

@Injectable()
export class RealEstateSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RealEstateSchedulerService.name);
  private readonly cronJobName = 'real-estate-daily-collect';
  private nextRunAt: Date | null = null;
  private isExecuting = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly scraper: RealEstateScraperService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSettingsExists();
    await this.scheduleNextRun();
  }

  async onModuleDestroy(): Promise<void> {
    this.clearScheduledJob();
  }

  async getSettings(): Promise<RealEstateScheduleSettingsResponse> {
    const settings = await this.getOrCreateSettings();
    return this.mapToResponse(settings);
  }

  async updateSettings(
    dto: UpdateRealEstateScheduleSettingsDto,
  ): Promise<RealEstateScheduleSettingsResponse> {
    const current = await this.getOrCreateSettings();

    const updated = (await this.prisma.realEstateScheduleSettings.update({
      where: { id: current.id },
      data: {
        enabled: dto.enabled,
        runHour: dto.runHour,
        runMinute: dto.runMinute,
        timezoneOffsetMinutes: dto.timezoneOffsetMinutes,
      },
    })) as RealEstateScheduleSettings;

    const nextRun = await this.scheduleNextRun(updated);

    return this.mapToResponse(updated, nextRun ?? undefined);
  }

  async triggerManualRun(): Promise<RealEstateManualRunResponse> {
    return this.executeCollection('manual');
  }

  private async executeCollection(
    source: 'manual' | 'timer',
  ): Promise<RealEstateManualRunResponse> {
    if (this.isExecuting) {
      const settings = await this.getOrCreateSettings();
      return {
        started: false,
        reason:
          source === 'manual'
            ? 'Сбор объявлений уже выполняется'
            : 'Задача уже выполняется, новый запуск пропущен',
        settings: this.mapToResponse(settings),
      };
    }

    const settings = await this.getOrCreateSettings();

    if (!settings.enabled && source !== 'manual') {
      this.logger.log('Ежедневный сбор объявлений отключён — запуск пропущен');
      return {
        started: false,
        reason: 'Расписание отключено',
        settings: this.mapToResponse(settings),
      };
    }

    this.isExecuting = true;

    try {
      const since = settings.lastRunAt ?? this.calculateDefaultLookback();
      const summary = await this.scraper.collectDailyListings({
        publishedAfter: since,
      });
      const completedAt = new Date();

      const updated = (await this.prisma.realEstateScheduleSettings.update({
        where: { id: settings.id },
        data: { lastRunAt: completedAt },
      })) as RealEstateScheduleSettings;

      const nextRun = await this.scheduleNextRun(updated);

      return {
        started: true,
        reason: null,
        summary,
        settings: this.mapToResponse(updated, nextRun ?? undefined),
      };
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Не удалось выполнить сбор объявлений';
      this.logger.error(
        'Ошибка при выполнении ежедневного сбора объявлений',
        error as Error,
      );
      await this.scheduleNextRun(settings);
      return {
        started: false,
        reason: message,
        settings: this.mapToResponse(settings),
      };
    } finally {
      this.isExecuting = false;
    }
  }

  private async ensureSettingsExists(): Promise<void> {
    const existing = await this.prisma.realEstateScheduleSettings.findFirst();

    if (existing) {
      return;
    }

    await this.prisma.realEstateScheduleSettings.create({
      data: {
        enabled: false,
        runHour: 2,
        runMinute: 0,
        timezoneOffsetMinutes: 0,
      },
    });
  }

  private async getOrCreateSettings(): Promise<RealEstateScheduleSettings> {
    const settings = await this.prisma.realEstateScheduleSettings.findFirst();

    if (settings) {
      return settings as RealEstateScheduleSettings;
    }

    const created = (await this.prisma.realEstateScheduleSettings.create({
      data: {
        enabled: false,
        runHour: 2,
        runMinute: 0,
        timezoneOffsetMinutes: 0,
      },
    })) as RealEstateScheduleSettings;

    return created;
  }

  private async scheduleNextRun(
    settings?: RealEstateScheduleSettings,
  ): Promise<Date | null> {
    const record = settings ?? (await this.getOrCreateSettings());

    this.clearScheduledJob();

    if (!record.enabled) {
      this.nextRunAt = null;
      return null;
    }

    const nextRun = this.calculateNextRunDate(record);
    this.nextRunAt = nextRun;

    const job = new CronJob(
      nextRun,
      () => {
        void this.executeCollection('timer');
      },
      undefined,
      false,
      'UTC',
      undefined,
      undefined,
      undefined,
      true,
    );

    this.schedulerRegistry.addCronJob(this.cronJobName, job as unknown as any);
    job.start();

    return nextRun;
  }

  private calculateNextRunDate(settings: RealEstateScheduleSettings): Date {
    const now = new Date();
    const next = new Date(now);
    next.setUTCSeconds(0, 0);

    const offset = settings.timezoneOffsetMinutes ?? 0;
    const runLocalMinutes = settings.runHour * 60 + settings.runMinute;
    const runUtcTotalMinutes = this.normalizeMinutes(runLocalMinutes + offset);
    const runUtcHour = Math.floor(runUtcTotalMinutes / 60);
    const runUtcMinute = runUtcTotalMinutes % 60;

    next.setUTCHours(runUtcHour, runUtcMinute, 0, 0);

    if (next <= now) {
      next.setUTCDate(next.getUTCDate() + 1);
    }

    return next;
  }

  private calculateDefaultLookback(): Date {
    const ms = DEFAULT_LOOKBACK_HOURS * 60 * 60 * 1000;
    return new Date(Date.now() - ms);
  }

  private mapToResponse(
    record: RealEstateScheduleSettings,
    nextRunAt: Date | undefined = this.nextRunAt ?? undefined,
  ): RealEstateScheduleSettingsResponse {
    return {
      enabled: record.enabled,
      runHour: record.runHour,
      runMinute: record.runMinute,
      timezoneOffsetMinutes: record.timezoneOffsetMinutes,
      lastRunAt: record.lastRunAt
        ? this.formatWithOffset(record.lastRunAt, record.timezoneOffsetMinutes)
        : null,
      nextRunAt:
        record.enabled && nextRunAt
          ? this.formatWithOffset(nextRunAt, record.timezoneOffsetMinutes)
          : null,
      isRunning: this.isExecuting,
    };
  }

  private clearScheduledJob(): void {
    try {
      const job = this.schedulerRegistry.getCronJob(this.cronJobName);
      job.stop();
      this.schedulerRegistry.deleteCronJob(this.cronJobName);
    } catch (error) {
      this.handleSchedulerNotFound(error);
    }
  }

  private handleSchedulerNotFound(error: unknown): void {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes('does not exist') ||
        message.includes('doesn') ||
        message.includes('not found') ||
        message.includes('check that you created one')
      ) {
        return;
      }
    }
    throw error;
  }

  private formatWithOffset(date: Date, timezoneOffsetMinutes: number): string {
    const localTimestamp = date.getTime() - timezoneOffsetMinutes * 60_000;
    const localDate = new Date(localTimestamp);

    const year = localDate.getUTCFullYear();
    const month = this.pad(localDate.getUTCMonth() + 1);
    const day = this.pad(localDate.getUTCDate());
    const hours = this.pad(localDate.getUTCHours());
    const minutes = this.pad(localDate.getUTCMinutes());
    const seconds = this.pad(localDate.getUTCSeconds());
    const millis = `${localDate.getUTCMilliseconds()}`.padStart(3, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}`;
  }

  private pad(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  private normalizeMinutes(value: number): number {
    const minutesInDay = 24 * 60;
    const normalized = value % minutesInDay;
    return normalized < 0 ? normalized + minutesInDay : normalized;
  }
}
