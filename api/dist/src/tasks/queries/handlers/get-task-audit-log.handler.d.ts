import { IQueryHandler } from '@nestjs/cqrs';
import { GetTaskAuditLogQuery } from '../impl/get-task-audit-log.query.js';
import { TaskAuditLogRepository } from '../../../tasks/repositories/task-audit-log.repository.js';
import type { TaskAuditLog } from '../../../tasks/interfaces/task-audit-log.interface.js';
export declare class GetTaskAuditLogHandler implements IQueryHandler<GetTaskAuditLogQuery, TaskAuditLog[]> {
    private readonly auditLogRepository;
    constructor(auditLogRepository: TaskAuditLogRepository);
    execute(query: GetTaskAuditLogQuery): Promise<TaskAuditLog[]>;
}
