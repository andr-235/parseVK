import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GetTaskByIdQuery } from '../impl/get-task-by-id.query.js';
import type { ITasksRepository } from '@/tasks/interfaces/tasks-repository.interface.js';
import type { TaskDetail } from '@/tasks/interfaces/task.interface.js';
import { TaskMapper } from '@/tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '@/tasks/parsers/task-description.parser.js';
import type { TaskRecord } from '@/tasks/types/task-record.type.js';

@Injectable()
@QueryHandler(GetTaskByIdQuery)
export class GetTaskByIdHandler implements IQueryHandler<
  GetTaskByIdQuery,
  TaskDetail
> {
  constructor(
    @Inject('ITasksRepository')
    private readonly repository: ITasksRepository,
    private readonly taskMapper: TaskMapper,
    private readonly descriptionParser: TaskDescriptionParser,
  ) {}

  async execute(query: GetTaskByIdQuery): Promise<TaskDetail> {
    const task = await this.repository.findUnique({
      id: query.taskId,
    });

    if (!task) {
      throw new NotFoundException(`Задача с id=${query.taskId} не найдена`);
    }

    return this.mapTaskToDetail(task);
  }

  private mapTaskToDetail(task: TaskRecord): TaskDetail {
    const parsed = this.descriptionParser.parse(task);
    const status =
      this.taskMapper.parseTaskStatus(task.status) ??
      this.taskMapper.resolveTaskStatus(task, parsed);
    return this.taskMapper.mapToDetail(task, parsed, status);
  }
}
