import { PrismaService } from '../../prisma.service.js';
import type { TaskAuditLog, CreateTaskAuditLogData } from '../../tasks/interfaces/task-audit-log.interface.js';
export declare class TaskAuditLogRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateTaskAuditLogData): Promise<TaskAuditLog>;
    findByTaskId(taskId: number): Promise<TaskAuditLog[]>;
}
