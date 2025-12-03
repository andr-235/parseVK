import type { Task, Prisma } from '@prisma/client';

export interface ITasksRepository {
  create(data: Prisma.TaskUncheckedCreateInput): Promise<Task>;
  findMany(params?: {
    orderBy?: Prisma.TaskOrderByWithRelationInput;
  }): Promise<Task[]>;
  findUnique(where: { id: number }): Promise<Task | null>;
  update(
    where: { id: number },
    data: Prisma.TaskUncheckedUpdateInput,
  ): Promise<Task>;
  delete(where: { id: number }): Promise<void>;
}

