import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type {
  IParsingTaskRepository,
  ParsingGroupRecord,
  ParsingTaskRecord,
  PostUpsertData,
  TaskUpdateData,
} from '../interfaces/parsing-task-repository.interface';
import { ParsingScope } from '../dto/create-parsing-task.dto';
import {
  toCreateJsonValue,
  toUpdateJsonValue,
} from '../../common/utils/prisma-json.utils';

@Injectable()
export class ParsingTaskRepository implements IParsingTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTaskById(taskId: number): Promise<ParsingTaskRecord | null> {
    return this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        description: true,
        totalItems: true,
        processedItems: true,
        progress: true,
        completed: true,
      },
    });
  }

  async updateTask(
    taskId: number,
    data: TaskUpdateData,
  ): Promise<ParsingTaskRecord | null> {
    try {
      return await this.prisma.task.update({
        where: { id: taskId },
        data,
        select: {
          id: true,
          description: true,
          totalItems: true,
          processedItems: true,
          progress: true,
          completed: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return null;
      }
      throw error;
    }
  }

  updateTaskStatus(
    taskId: number,
    status: 'running' | 'failed',
  ): Promise<ParsingTaskRecord | null> {
    return this.updateTask(taskId, { status });
  }

  async findGroups(
    scope: ParsingScope,
    groupIds: number[],
  ): Promise<ParsingGroupRecord[]> {
    if (scope === ParsingScope.ALL) {
      return this.prisma.group.findMany({
        orderBy: { updatedAt: 'desc' },
        select: { id: true, vkId: true, name: true, wall: true },
      });
    }

    if (!groupIds.length) {
      return [];
    }

    return this.prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: { id: true, vkId: true, name: true, wall: true },
    });
  }

  async updateGroupWall(groupId: number, wall: number): Promise<void> {
    await this.prisma.group.update({
      where: { id: groupId },
      data: { wall },
    });
  }

  async upsertPost(data: PostUpsertData): Promise<void> {
    const attachmentsUpdate =
      data.attachments !== undefined
        ? toUpdateJsonValue(data.attachments)
        : undefined;
    const attachmentsCreate =
      data.attachments !== undefined
        ? toCreateJsonValue(data.attachments)
        : undefined;
    const baseData = {
      groupId: data.groupId,
      fromId: data.fromId,
      postedAt: data.postedAt,
      text: data.text,
      commentsCount: data.commentsCount,
      commentsCanPost: data.commentsCanPost,
      commentsGroupsCanPost: data.commentsGroupsCanPost,
      commentsCanClose: data.commentsCanClose,
      commentsCanOpen: data.commentsCanOpen,
    };

    const updateData = {
      ...baseData,
      ...(attachmentsUpdate !== undefined && {
        attachments: attachmentsUpdate,
      }),
    };

    const createData = {
      ownerId: data.ownerId,
      vkPostId: data.vkPostId,
      ...baseData,
      ...(attachmentsCreate !== undefined && {
        attachments: attachmentsCreate,
      }),
    };

    await this.prisma.post.upsert({
      where: {
        ownerId_vkPostId: {
          ownerId: data.ownerId,
          vkPostId: data.vkPostId,
        },
      },
      update: updateData,
      create: createData,
    });
  }
}
