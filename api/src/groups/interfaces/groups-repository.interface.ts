import type { IGroupResponse } from './group.interface';

export type GroupOrderByInput = Record<string, 'asc' | 'desc'>;

export type GroupUpsertData = Omit<
  IGroupResponse,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface GetGroupsWithCountResult {
  items: IGroupResponse[];
  total: number;
}

export interface IGroupsRepository {
  upsert(
    where: { vkId: number },
    data: GroupUpsertData,
  ): Promise<IGroupResponse>;
  findMany(params: {
    skip?: number;
    take?: number;
    orderBy?: GroupOrderByInput;
  }): Promise<IGroupResponse[]>;
  count(): Promise<number>;
  getGroupsWithCount(params: {
    skip: number;
    take: number;
  }): Promise<GetGroupsWithCountResult>;
  delete(where: { id: number }): Promise<IGroupResponse>;
  deleteMany(): Promise<{ count: number }>;
  findManyByVkIds(vkIds: number[]): Promise<IGroupResponse[]>;
}
