import { Injectable } from '@nestjs/common';
import type { Task, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type { ITasksRepository } from '../interfaces/tasks-repository.interface';

@Injectable()
export class TasksRepository implements ITasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.TaskUncheckedCreateInput): Promise<Task> {
    return this.prisma.task.create({ data });
  }

  async findMany(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.TaskOrderByWithRelationInput;
  }): Promise<Task[]> {
    return this.prisma.task.findMany(params);
  }

  async count(): Promise<number> {
    return this.prisma.task.count();
  }

  async findUnique(where: { id: number }): Promise<Task | null> {
    return this.prisma.task.findUnique({ where });
  }

  async update(
    where: { id: number },
    data: Prisma.TaskUncheckedUpdateInput,
  ): Promise<Task> {
    return this.prisma.task.update({ where, data });
  }

  async delete(where: { id: number }): Promise<void> {
    await this.prisma.task.delete({ where });
  }
}

