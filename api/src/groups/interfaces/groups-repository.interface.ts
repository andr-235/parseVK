import type { Group, Prisma } from '@prisma/client';

export interface GetGroupsWithCountResult {
  items: Group[];
  total: number;
}

export interface IGroupsRepository {
  upsert(
    where: { vkId: number },
    data: Prisma.GroupCreateInput,
  ): Promise<Group>;
  findMany(params: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.GroupOrderByWithRelationInput;
  }): Promise<Group[]>;
  count(): Promise<number>;
  getGroupsWithCount(params: {
    skip: number;
    take: number;
  }): Promise<GetGroupsWithCountResult>;
  delete(where: { id: number }): Promise<Group>;
  deleteMany(): Promise<{ count: number }>;
  findManyByVkIds(vkIds: number[]): Promise<Group[]>;
}
