import { Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client.js';
import { PrismaService } from '@/prisma.service.js';
import type {
  TaskAuditLog,
  CreateTaskAuditLogData,
} from '@/tasks/interfaces/task-audit-log.interface.js';

@Injectable()
export class TaskAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskAuditLogData): Promise<TaskAuditLog> {
    return this.prisma.taskAuditLog.create({
      data: {
        taskId: data.taskId,
        eventType: data.eventType,
        eventData: data.eventData as Prisma.InputJsonValue,
      },
    });
  }

  async findByTaskId(taskId: number): Promise<TaskAuditLog[]> {
    return this.prisma.taskAuditLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
