import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { GetTasksQuery } from '../impl/get-tasks.query.js';
import type { ITasksRepository } from '@/tasks/interfaces/tasks-repository.interface.js';
import type { TaskSummary } from '@/tasks/interfaces/task.interface.js';
import { TaskMapper } from '@/tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '@/tasks/parsers/task-description.parser.js';
import type { TaskRecord } from '@/tasks/types/task-record.type.js';

export interface GetTasksResult {
  tasks: TaskSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

@Injectable()
@QueryHandler(GetTasksQuery)
export class GetTasksHandler implements IQueryHandler<
  GetTasksQuery,
  GetTasksResult
> {
  constructor(
    @Inject('ITasksRepository')
    private readonly repository: ITasksRepository,
    private readonly taskMapper: TaskMapper,
    private readonly descriptionParser: TaskDescriptionParser,
  ) {}

  async execute(query: GetTasksQuery): Promise<GetTasksResult> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.repository.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.repository.count(),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    const hasMore = page < totalPages;

    return {
      tasks: tasks.map((task) => this.mapTaskToSummary(task)),
      total,
      page,
      limit,
      totalPages,
      hasMore,
    };
  }

  private mapTaskToSummary(task: TaskRecord): TaskSummary {
    const parsed = this.descriptionParser.parse(task);
    const status =
      this.taskMapper.parseTaskStatus(task.status) ??
      this.taskMapper.resolveTaskStatus(task, parsed);
    return this.taskMapper.mapToSummary(task, parsed, status);
  }
}
