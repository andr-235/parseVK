import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetTaskAuditLogQuery } from '../impl/get-task-audit-log.query.js';
import { TaskAuditLogRepository } from '@/tasks/repositories/task-audit-log.repository.js';
import type { TaskAuditLog } from '@/tasks/interfaces/task-audit-log.interface.js';

@Injectable()
@QueryHandler(GetTaskAuditLogQuery)
export class GetTaskAuditLogHandler implements IQueryHandler<
  GetTaskAuditLogQuery,
  TaskAuditLog[]
> {
  constructor(private readonly auditLogRepository: TaskAuditLogRepository) {}

  async execute(query: GetTaskAuditLogQuery): Promise<TaskAuditLog[]> {
    return this.auditLogRepository.findByTaskId(query.taskId);
  }
}
