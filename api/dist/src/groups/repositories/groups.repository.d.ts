import { PrismaService } from '../../prisma.service.js';
import type { GetGroupsWithCountResult, GroupOrderByInput, GroupUpsertData, IGroupsRepository } from '../interfaces/groups-repository.interface.js';
import type { IGroupResponse } from '../interfaces/group.interface.js';
export declare class GroupsRepository implements IGroupsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsert(where: {
        vkId: number;
    }, data: GroupUpsertData): Promise<IGroupResponse>;
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
    delete(where: {
        id: number;
    }): Promise<IGroupResponse>;
    deleteMany(): Promise<{
        count: number;
    }>;
    findManyByVkIds(vkIds: number[]): Promise<IGroupResponse[]>;
}
