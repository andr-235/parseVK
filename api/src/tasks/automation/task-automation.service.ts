import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../../prisma.service'
import { TasksService } from '../tasks.service'
import { ParsingScope } from '../dto/create-parsing-task.dto'
import type {
  TaskAutomationRunResponse,
  TaskAutomationSettings,
  TaskAutomationSettingsResponse
} from './task-automation.interface'
import { UpdateTaskAutomationSettingsDto } from './dto/update-task-automation-settings.dto'

const RETRY_DELAY_MS = 60 * 60 * 1000 // 1 час

@Injectable()
export class TaskAutomationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TaskAutomationService.name)
  private nextRunTimer: NodeJS.Timeout | null = null
  private nextRunAt: Date | null = null
  private isExecuting = false

  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSettingsExists()
    await this.scheduleNextRun()
  }

  async onModuleDestroy(): Promise<void> {
    this.clearTimer()
  }

  async getSettings(): Promise<TaskAutomationSettingsResponse> {
    const record = await this.getOrCreateSettings()
    const nextRun = record.enabled ? this.nextRunAt ?? this.calculateNextRunDate(record) : null

    return this.mapToResponse(record, nextRun)
  }

  async updateSettings(
    dto: UpdateTaskAutomationSettingsDto,
  ): Promise<TaskAutomationSettingsResponse> {
    const current = await this.getOrCreateSettings()

    const updated = (await this.prisma.taskAutomationSettings.update({
      where: { id: current.id },
      data: {
        enabled: dto.enabled,
        runHour: dto.runHour,
        runMinute: dto.runMinute,
        postLimit: dto.postLimit,
      },
    })) as TaskAutomationSettings

    await this.scheduleNextRun(updated)

    return this.mapToResponse(updated)
  }

  async triggerManualRun(): Promise<TaskAutomationRunResponse> {
    const result = await this.executeAutomation('manual')
    const settings = await this.getOrCreateSettings()

    return {
      started: result.started,
      reason: result.reason,
      settings: this.mapToResponse(settings),
    }
  }

  private async executeAutomation(
    source: 'manual' | 'timer' | 'retry',
  ): Promise<{ started: boolean; reason: string | null }> {
    if (this.isExecuting) {
      if (source !== 'manual') {
        this.logger.log('Автозапуск уже выполняется, перезапланируем попытку')
        this.scheduleRetry()
      }
      return { started: false, reason: 'Задача автозапуска уже выполняется' }
    }

    const settings = await this.getOrCreateSettings()

    if (!settings.enabled && source !== 'manual') {
      this.logger.log('Автоматический запуск выключен — таймер остановлен')
      return { started: false, reason: 'Автозапуск отключён' }
    }

    this.isExecuting = true

    try {
      if (await this.hasActiveTasks()) {
        this.logger.log('Обнаружены активные задачи, автозапуск отложен')
        if (source !== 'manual') {
          this.scheduleRetry()
        }
        return {
          started: false,
          reason: 'Есть незавершённые задачи, повторим позже',
        }
      }

      await this.tasksService.createParsingTask({
        scope: ParsingScope.ALL,
        postLimit: settings.postLimit,
      })

      await this.prisma.taskAutomationSettings.update({
        where: { id: settings.id },
        data: { lastRunAt: new Date() },
      })

      this.logger.log(`Автоматический запуск выполнен успешно (${source})`)

      await this.scheduleNextRun()

      return { started: true, reason: null }
    } catch (error) {
      this.logger.error('Не удалось выполнить автоматический запуск задач', error as Error)
      const reason =
        error instanceof Error && error.message
          ? error.message
          : 'Ошибка при запуске задач, повторим попытку позже'
      if (source !== 'manual') {
        this.scheduleRetry()
      }
      return {
        started: false,
        reason,
      }
    } finally {
      this.isExecuting = false
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
    })

    return count > 0
  }

  private async ensureSettingsExists(): Promise<void> {
    const existing = await this.prisma.taskAutomationSettings.findFirst()

    if (existing) {
      return
    }

    await this.prisma.taskAutomationSettings.create({
      data: {
        enabled: false,
        runHour: 3,
        runMinute: 0,
        postLimit: 10,
      },
    })
  }

  private async getOrCreateSettings(): Promise<TaskAutomationSettings> {
    const settings = await this.prisma.taskAutomationSettings.findFirst()

    if (settings) {
      return settings as TaskAutomationSettings
    }

    const created = (await this.prisma.taskAutomationSettings.create({
      data: {
        enabled: false,
        runHour: 3,
        runMinute: 0,
        postLimit: 10,
      },
    })) as TaskAutomationSettings

    return created
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
      lastRunAt: record.lastRunAt ? record.lastRunAt.toISOString() : null,
      nextRunAt: record.enabled && nextRunAt ? nextRunAt.toISOString() : null,
      isRunning: this.isExecuting,
    }
  }

  private calculateNextRunDate(settings: TaskAutomationSettings): Date {
    const now = new Date()
    const next = new Date(now)
    next.setSeconds(0, 0)
    next.setHours(settings.runHour, settings.runMinute, 0, 0)

    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }

    return next
  }

  private async scheduleNextRun(
    settings?: TaskAutomationSettings,
  ): Promise<void> {
    const record = settings ?? (await this.getOrCreateSettings())

    this.clearTimer()

    if (!record.enabled) {
      this.nextRunAt = null
      return
    }

    const nextRun = this.calculateNextRunDate(record)
    const delay = Math.max(nextRun.getTime() - Date.now(), 1_000)

    this.nextRunAt = nextRun
    this.nextRunTimer = setTimeout(() => {
      void this.executeAutomation('timer')
    }, delay)

    if (typeof this.nextRunTimer.unref === 'function') {
      this.nextRunTimer.unref()
    }
  }

  private scheduleRetry(): void {
    this.clearTimer()

    const retryAt = new Date(Date.now() + RETRY_DELAY_MS)
    this.nextRunAt = retryAt
    this.nextRunTimer = setTimeout(() => {
      void this.executeAutomation('retry')
    }, RETRY_DELAY_MS)

    if (typeof this.nextRunTimer.unref === 'function') {
      this.nextRunTimer.unref()
    }
  }

  private clearTimer(): void {
    if (this.nextRunTimer) {
      clearTimeout(this.nextRunTimer)
      this.nextRunTimer = null
    }
  }
}
