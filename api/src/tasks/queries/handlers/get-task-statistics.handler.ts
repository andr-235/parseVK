import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { GetTaskStatisticsQuery } from '../impl/get-task-statistics.query.js';
import type {
  ITasksRepository,
  TaskWhereInput,
} from '@/tasks/interfaces/tasks-repository.interface.js';
import type { TaskRecord } from '@/tasks/types/task-record.type.js';

export interface TaskStatistics {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

@Injectable()
@QueryHandler(GetTaskStatisticsQuery)
export class GetTaskStatisticsHandler implements IQueryHandler<
  GetTaskStatisticsQuery,
  TaskStatistics
> {
  constructor(
    @Inject('ITasksRepository')
    private readonly repository: ITasksRepository,
  ) {}

  async execute(query: GetTaskStatisticsQuery): Promise<TaskStatistics> {
    const filters = query.filters;

    // Build where condition with proper typing
    const where: TaskWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    // Get all tasks with filters
    const allTasks = await this.repository.findMany({ where });

    // Calculate statistics
    const total = allTasks.length;
    const pending = allTasks.filter(
      (task: TaskRecord) => task.status === 'pending',
    ).length;
    const running = allTasks.filter(
      (task: TaskRecord) => task.status === 'running',
    ).length;
    const completed = allTasks.filter(
      (task: TaskRecord) => task.completed === true || task.status === 'done',
    ).length;
    const failed = allTasks.filter(
      (task: TaskRecord) => task.status === 'failed',
    ).length;

    return {
      total,
      pending,
      running,
      completed,
      failed,
    };
  }
}
