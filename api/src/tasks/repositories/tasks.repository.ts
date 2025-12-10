import { Injectable } from '@nestjs/common';
import type { Task, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type { ITasksRepository } from '../interfaces/tasks-repository.interface';

@Injectable()
export class TasksRepository implements ITasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.TaskUncheckedCreateInput): Promise<Task> {
    return this.prisma.task.create({ data });
  }

  findMany(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.TaskOrderByWithRelationInput;
  }): Promise<Task[]> {
    return this.prisma.task.findMany(params);
  }

  count(): Promise<number> {
    return this.prisma.task.count();
  }

  findUnique(where: { id: number }): Promise<Task> {
    return this.prisma.task.findUniqueOrThrow({ where });
  }

  update(
    where: { id: number },
    data: Prisma.TaskUncheckedUpdateInput,
  ): Promise<Task> {
    return this.prisma.task.update({ where, data });
  }

  async delete(where: { id: number }): Promise<void> {
    await this.prisma.task.delete({ where });
  }
}
