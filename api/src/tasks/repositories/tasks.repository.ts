import { Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '../../prisma.service';
import type {
  ITasksRepository,
  TaskCreateData,
  TaskOrderByInput,
  TaskUpdateData,
} from '../interfaces/tasks-repository.interface';
import type { TaskRecord } from '../types/task-record.type';

@Injectable()
export class TasksRepository implements ITasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: TaskCreateData): Promise<TaskRecord> {
    return this.prisma.task.create({ data });
  }

  findMany(params?: {
    skip?: number;
    take?: number;
    orderBy?: TaskOrderByInput;
  }): Promise<TaskRecord[]> {
    return this.prisma.task.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: params?.orderBy as Prisma.TaskOrderByWithRelationInput,
    });
  }

  count(): Promise<number> {
    return this.prisma.task.count();
  }

  findUnique(where: { id: number }): Promise<TaskRecord | null> {
    return this.prisma.task.findUnique({ where });
  }

  update(
    where: { id: number },
    data: TaskUpdateData,
  ): Promise<TaskRecord | null> {
    return this.prisma.task.update({ where, data }).catch((error: unknown) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return null;
      }
      throw error;
    });
  }

  async delete(where: { id: number }): Promise<void> {
    await this.prisma.task.delete({ where });
  }
}
