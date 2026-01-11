import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type {
  ITaskAutomationRepository,
  TaskAutomationRepositorySettings,
  TaskAutomationSettingsUpdate,
} from '../interfaces/task-automation-repository.interface';

const DEFAULT_SETTINGS: TaskAutomationSettingsUpdate = {
  enabled: false,
  runHour: 3,
  runMinute: 0,
  postLimit: 10,
  timezoneOffsetMinutes: 0,
};

@Injectable()
export class TaskAutomationRepository implements ITaskAutomationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSettingsExists(): Promise<void> {
    const existing = await this.prisma.taskAutomationSettings.findFirst();
    if (existing) {
      return;
    }
    await this.prisma.taskAutomationSettings.create({
      data: { ...DEFAULT_SETTINGS },
    });
  }

  async getOrCreateSettings(): Promise<TaskAutomationRepositorySettings> {
    const settings = await this.prisma.taskAutomationSettings.findFirst();
    if (settings) {
      return settings as TaskAutomationRepositorySettings;
    }

    return this.prisma.taskAutomationSettings.create({
      data: { ...DEFAULT_SETTINGS },
    }) as Promise<TaskAutomationRepositorySettings>;
  }

  updateSettings(
    id: number,
    data: TaskAutomationSettingsUpdate,
  ): Promise<TaskAutomationRepositorySettings> {
    return this.prisma.taskAutomationSettings.update({
      where: { id },
      data,
    }) as Promise<TaskAutomationRepositorySettings>;
  }

  async updateLastRunAt(id: number, date: Date): Promise<void> {
    await this.prisma.taskAutomationSettings.update({
      where: { id },
      data: { lastRunAt: date },
    });
  }

  async hasActiveTasks(): Promise<boolean> {
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

  findLastCompletedTask(): Promise<{ description: string | null } | null> {
    return this.prisma.task.findFirst({
      where: {
        completed: true,
        status: 'done',
      },
      orderBy: { updatedAt: 'desc' },
      select: { description: true },
    });
  }
}
