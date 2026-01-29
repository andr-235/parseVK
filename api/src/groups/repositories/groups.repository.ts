import { Injectable } from '@nestjs/common';
import type { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '../../prisma.service';
import type {
  GetGroupsWithCountResult,
  GroupOrderByInput,
  GroupUpsertData,
  IGroupsRepository,
} from '../interfaces/groups-repository.interface';
import type { IGroupResponse } from '../interfaces/group.interface';

@Injectable()
export class GroupsRepository implements IGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(
    where: { vkId: number },
    data: GroupUpsertData,
  ): Promise<IGroupResponse> {
    return this.prisma.group.upsert({
      where,
      update: data as Prisma.GroupCreateInput,
      create: data as Prisma.GroupCreateInput,
    });
  }

  findMany(params: {
    skip?: number;
    take?: number;
    orderBy?: GroupOrderByInput;
  }): Promise<IGroupResponse[]> {
    return this.prisma.group.findMany({
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy as Prisma.GroupOrderByWithRelationInput,
    });
  }

  count(): Promise<number> {
    return this.prisma.group.count();
  }

  async getGroupsWithCount(params: {
    skip: number;
    take: number;
  }): Promise<GetGroupsWithCountResult> {
    return this.prisma.$transaction(async (tx) => {
      const items = await tx.group.findMany({
        orderBy: { updatedAt: 'desc' },
        skip: params.skip,
        take: params.take,
      });
      const total = await tx.group.count();
      return { items, total };
    });
  }

  delete(where: { id: number }): Promise<IGroupResponse> {
    return this.prisma.group.delete({ where });
  }

  deleteMany(): Promise<{ count: number }> {
    return this.prisma.group.deleteMany({});
  }

  findManyByVkIds(vkIds: number[]): Promise<IGroupResponse[]> {
    return this.prisma.group.findMany({
      where: {
        vkId: {
          in: vkIds,
        },
      },
    });
  }
}
