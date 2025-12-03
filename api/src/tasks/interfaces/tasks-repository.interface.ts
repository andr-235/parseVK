import type { Task, Prisma } from '@prisma/client';

export interface ITasksRepository {
  create(data: Prisma.TaskUncheckedCreateInput): Promise<Task>;
  findMany(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.TaskOrderByWithRelationInput;
  }): Promise<Task[]>;
  count(): Promise<number>;
  findUnique(where: { id: number }): Promise<Task | null>;
  update(
    where: { id: number },
    data: Prisma.TaskUncheckedUpdateInput,
  ): Promise<Task>;
  delete(where: { id: number }): Promise<void>;
}
