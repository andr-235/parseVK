import { Injectable } from '@nestjs/common';
import type { Group, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type {
  GetGroupsWithCountResult,
  IGroupsRepository,
} from '../interfaces/groups-repository.interface';

@Injectable()
export class GroupsRepository implements IGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    where: { vkId: number },
    data: Prisma.GroupCreateInput,
  ): Promise<Group> {
    return this.prisma.group.upsert({
      where,
      update: data,
      create: data,
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.GroupOrderByWithRelationInput;
  }): Promise<Group[]> {
    return this.prisma.group.findMany(params);
  }

  async count(): Promise<number> {
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

  async delete(where: { id: number }): Promise<Group> {
    return this.prisma.group.delete({ where });
  }

  async deleteMany(): Promise<{ count: number }> {
    return this.prisma.group.deleteMany({});
  }

  async findManyByVkIds(vkIds: number[]): Promise<Group[]> {
    return this.prisma.group.findMany({
      where: {
        vkId: {
          in: vkIds,
        },
      },
    });
  }
}
