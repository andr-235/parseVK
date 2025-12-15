import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { TasksService } from '../tasks.service';
import { ParsingScope } from '../dto/create-parsing-task.dto';
import type {
  TaskAutomationRunResponse,
  TaskAutomationSettings,
  TaskAutomationSettingsResponse,
} from './task-automation.interface';
import { UpdateTaskAutomationSettingsDto } from './dto/update-task-automation-settings.dto';

const RETRY_DELAY_MS = 60 * 60 * 1000; // 1 час
const DEFAULT_POST_LIMIT = 10;

@Injectable()
export class TaskAutomationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TaskAutomationService.name);
  private readonly nextRunJobName = 'task-automation-next-run';
  private readonly retryTimeoutName = 'task-automation-retry';
  private nextRunAt: Date | null = null;
  private isExecuting = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSettingsExists();
    await this.scheduleNextRun();
  }

  onModuleDestroy(): void {
    this.clearScheduledTimeout();
    this.clearRetryTimeout();
  }

  async getSettings(): Promise<TaskAutomationSettingsResponse> {
    const record = await this.getOrCreateSettings();
    const nextRun = record.enabled
      ? (this.nextRunAt ?? this.calculateNextRunDate(record))
      : null;

    return this.mapToResponse(record, nextRun);
  }

  async updateSettings(
    dto: UpdateTaskAutomationSettingsDto,
  ): Promise<TaskAutomationSettingsResponse> {
    const current = await this.getOrCreateSettings();

    const updated = (await this.prisma.taskAutomationSettings.update({
      where: { id: current.id },
      data: {
        enabled: dto.enabled,
        runHour: dto.runHour,
        runMinute: dto.runMinute,
        postLimit: dto.postLimit,
        timezoneOffsetMinutes: dto.timezoneOffsetMinutes,
      },
    })) as TaskAutomationSettings;

    const nextRun = await this.scheduleNextRun(updated);

    return this.mapToResponse(updated, nextRun ?? null);
  }

  async triggerManualRun(): Promise<TaskAutomationRunResponse> {
    const result = await this.executeAutomation('manual');
    const settings = await this.getOrCreateSettings();

    return {
      started: result.started,
      reason: result.reason,
      settings: this.mapToResponse(settings),
    };
  }

  private async executeAutomation(
    source: 'manual' | 'timer' | 'retry',
  ): Promise<{ started: boolean; reason: string | null }> {
    if (this.isExecuting) {
      if (source !== 'manual') {
        this.logger.log('Автозапуск уже выполняется, перезапланируем попытку');
        this.scheduleRetry();
      }
      return { started: false, reason: 'Задача автозапуска уже выполняется' };
    }

    const settings = await this.getOrCreateSettings();

    if (!settings.enabled && source !== 'manual') {
      this.logger.log('Автоматический запуск выключен — таймер остановлен');
      return { started: false, reason: 'Автозапуск отключён' };
    }

    this.isExecuting = true;

    try {
      const hasActive = await this.hasActiveTasks();
      if (hasActive) {
        this.logger.log('Обнаружены активные задачи, автозапуск отложен');
        if (source !== 'manual') {
          this.scheduleRetry();
        }
        return {
          started: false,
          reason: 'Есть незавершённые задачи, повторим позже',
        };
      }

      const lastCompleted = await this.findLastCompletedTask();

      if (!lastCompleted) {
        this.logger.warn('Не найдено завершённых задач для автозапуска');
        await this.scheduleNextRun();
        return {
          started: false,
          reason: 'Нет завершённых задач для повторного запуска',
        };
      }

      const taskConfig = this.extractTaskConfig(lastCompleted);

      if (!taskConfig) {
        this.logger.error(
          'Не удалось определить параметры последней задачи для автозапуска',
        );
        await this.scheduleNextRun();
        return {
          started: false,
          reason:
            'Последняя задача не содержит параметров для повторного запуска',
        };
      }

      await this.tasksService.createParsingTask({
        scope: taskConfig.scope,
        groupIds: taskConfig.groupIds,
        postLimit:
          settings.postLimit ?? taskConfig.postLimit ?? DEFAULT_POST_LIMIT,
      });

      await this.prisma.taskAutomationSettings.update({
        where: { id: settings.id },
        data: { lastRunAt: new Date() },
      });

      this.logger.log(`Автоматический запуск выполнен успешно (${source})`);

      await this.scheduleNextRun();

      return { started: true, reason: null };
    } catch (error) {
      this.logger.error(
        'Не удалось выполнить автоматический запуск задач',
        error as Error,
      );
      const reason =
        error instanceof Error && error.message
          ? error.message
          : 'Ошибка при запуске задач, повторим попытку позже';
      if (source !== 'manual') {
        this.scheduleRetry();
      }
      return {
        started: false,
        reason,
      };
    } finally {
      this.isExecuting = false;
    }
  }

  private async hasActiveTasks(): Promise<boolean> {
    const count = await this.prisma.task.count({
      where: {
        OR: [
          { status: { in: ['pending', 'running'] } },
          {
            AND: [
              { completed: { equals: false } },
              { status: { notIn: ['done', 'failed'] } },
            ],
          },
        ],
      },
    });

    return count > 0;
  }

  private async ensureSettingsExists(): Promise<void> {
    const existing = await this.prisma.taskAutomationSettings.findFirst();

    if (existing) {
      return;
    }

    await this.prisma.taskAutomationSettings.create({
      data: {
        enabled: false,
        runHour: 3,
        runMinute: 0,
        postLimit: 10,
        timezoneOffsetMinutes: 0,
      },
    });
  }

  private async getOrCreateSettings(): Promise<TaskAutomationSettings> {
    const settings = await this.prisma.taskAutomationSettings.findFirst();

    if (settings) {
      return settings as TaskAutomationSettings;
    }

    const created = (await this.prisma.taskAutomationSettings.create({
      data: {
        enabled: false,
        runHour: 3,
        runMinute: 0,
        postLimit: 10,
        timezoneOffsetMinutes: 0,
      },
    })) as TaskAutomationSettings;

    return created;
  }

  private mapToResponse(
    record: TaskAutomationSettings,
    nextRunAt: Date | null = this.nextRunAt,
  ): TaskAutomationSettingsResponse {
    return {
      enabled: record.enabled,
      runHour: record.runHour,
      runMinute: record.runMinute,
      postLimit: record.postLimit,
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

  private calculateNextRunDate(settings: TaskAutomationSettings): Date {
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

  private async scheduleNextRun(
    settings?: TaskAutomationSettings,
  ): Promise<Date | null> {
    const record = settings ?? (await this.getOrCreateSettings());

    this.clearRetryTimeout();
    this.clearScheduledTimeout();

    if (!record.enabled) {
      this.nextRunAt = null;
      this.logger.log('Автозапуск отключен, планирование не выполняется');
      return null;
    }

    const nextRun = this.calculateNextRunDate(record);
    this.nextRunAt = nextRun;

    const delay = nextRun.getTime() - Date.now();

    if (delay <= 0) {
      this.logger.warn(
        'Вычисленное время запуска в прошлом, пересчитываем на завтра',
      );
      const tomorrow = this.calculateNextRunDate(record);
      this.nextRunAt = tomorrow;
      return this.scheduleNextRun(record);
    }

    this.logger.log(
      `Планируем автозапуск на ${nextRun.toISOString()} (через ${Math.round(delay / 1000 / 60)} минут)`,
    );

    const timeout: NodeJS.Timeout = setTimeout(() => {
      try {
        this.schedulerRegistry.deleteTimeout(this.nextRunJobName);
      } catch {
        // проигнорируем отсутствие таймаута в реестре
      }
      void this.executeAutomation('timer');
    }, delay);

    if (typeof timeout.unref === 'function') {
      timeout.unref();
    }

    this.schedulerRegistry.addTimeout(this.nextRunJobName, timeout);

    return nextRun;
  }

  private scheduleRetry(): void {
    this.clearScheduledTimeout();
    this.clearRetryTimeout();

    const retryAt = new Date(Date.now() + RETRY_DELAY_MS);
    this.nextRunAt = retryAt;

    const timeout: NodeJS.Timeout = setTimeout(() => {
      try {
        this.schedulerRegistry.deleteTimeout(this.retryTimeoutName);
      } catch {
        // проигнорируем отсутствие таймаута в реестре
      }
      void this.executeAutomation('retry');
    }, RETRY_DELAY_MS);

    if (typeof timeout.unref === 'function') {
      timeout.unref();
    }

    this.schedulerRegistry.addTimeout(this.retryTimeoutName, timeout);
  }

  private clearScheduledTimeout(): void {
    try {
      const timeout = this.schedulerRegistry.getTimeout(
        this.nextRunJobName,
      ) as NodeJS.Timeout;
      clearTimeout(timeout);
      this.schedulerRegistry.deleteTimeout(this.nextRunJobName);
    } catch (error) {
      this.handleSchedulerNotFound(error);
    }
  }

  private clearRetryTimeout(): void {
    try {
      const timeout = this.schedulerRegistry.getTimeout(
        this.retryTimeoutName,
      ) as NodeJS.Timeout;
      clearTimeout(timeout);
      this.schedulerRegistry.deleteTimeout(this.retryTimeoutName);
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

  private async findLastCompletedTask() {
    return this.prisma.task.findFirst({
      where: {
        completed: true,
        status: 'done',
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private extractTaskConfig(task: { description: string | null }) {
    if (!task.description) {
      return null;
    }

    try {
      const parsed = JSON.parse(task.description) as {
        scope?: ParsingScope;
        groupIds?: number[];
        postLimit?: number;
      };

      return {
        scope: parsed.scope ?? ParsingScope.ALL,
        groupIds: Array.isArray(parsed.groupIds) ? parsed.groupIds : [],
        postLimit:
          typeof parsed.postLimit === 'number' ? parsed.postLimit : undefined,
      };
    } catch (error) {
      this.logger.error(
        'Не удалось разобрать описание последней задачи',
        error as Error,
      );
      return null;
    }
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
