jest.mock('vk-io', () => {
  class MockApiError extends Error {
    code: number;

    constructor(payload: { error_code: number; error_msg: string }) {
      super(payload.error_msg);
      this.code = payload.error_code;
    }
  }

  return { APIError: MockApiError };
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { APIError } from 'vk-io';
import { Prisma } from '@prisma/client';
import { TasksService } from './tasks.service';
import { ParsingScope } from './dto/create-parsing-task.dto';

interface MockTaskRecord {
  id: number;
  title: string;
  description: string | null;
  completed: boolean | null;
  totalItems: number | null;
  processedItems: number | null;
  progress: number | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MockGroupRecord {
  id: number;
  vkId: number;
  name: string;
  wall: number | null;
}

describe('TasksService', () => {
  let service: TasksService;
  let prismaMock: any;
  let vkMock: any;

  const createTaskRecord = (overrides: Partial<MockTaskRecord> = {}): MockTaskRecord => ({
    id: 1,
    title: 'task',
    description: null,
    completed: false,
    totalItems: 0,
    processedItems: 0,
    progress: 0,
    status: 'pending',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  });

  const setupService = () => {
    prismaMock = {
      task: {
        create: jest.fn().mockResolvedValue(createTaskRecord()),
        update: jest.fn().mockResolvedValue(createTaskRecord({ status: 'running' })),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      group: {
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      },
      post: {
        upsert: jest.fn().mockResolvedValue(undefined),
      },
      comment: {
        upsert: jest.fn().mockResolvedValue(undefined),
      },
      author: {
        upsert: jest.fn().mockResolvedValue(undefined),
      },
    };

    vkMock = {
      getGroupRecentPosts: jest.fn(),
      getComments: jest.fn(),
      getAuthors: jest.fn(),
    };

    service = new TasksService(prismaMock, vkMock);
  };

  beforeEach(() => {
    setupService();
  });

  describe('createParsingTask', () => {
    it('should create a parsing task, persist data and collect statistics', async () => {
      const group: MockGroupRecord = { id: 10, vkId: 500, name: 'Test group', wall: 1 };
      prismaMock.group.findMany.mockResolvedValue([group]);

      const taskRecord = createTaskRecord({ id: 42, totalItems: 1 });
      prismaMock.task.create.mockResolvedValue(taskRecord);

      const post = {
        id: 777,
        owner_id: -500,
        from_id: -500,
        date: 1,
        text: 'post',
        comments: {
          count: 1,
          can_post: 1,
          groups_can_post: true,
          can_close: false,
          can_open: true,
        },
      };
      vkMock.getGroupRecentPosts.mockResolvedValue([post]);

      const childComment = {
        vkCommentId: 2,
        ownerId: -500,
        postId: post.id,
        fromId: 2000,
        text: 'child',
        publishedAt: new Date('2024-01-01T01:00:00Z'),
        likesCount: 0,
        parentsStack: undefined,
        threadCount: 0,
        threadItems: [],
        attachments: undefined,
        replyToUser: 1000,
        replyToComment: 1,
        isDeleted: false,
      };

      const rootComment = {
        vkCommentId: 1,
        ownerId: -500,
        postId: post.id,
        fromId: 1000,
        text: 'root',
        publishedAt: new Date('2024-01-01T00:00:00Z'),
        likesCount: 5,
        parentsStack: [0],
        threadCount: 1,
        threadItems: [childComment],
        attachments: [],
        replyToUser: undefined,
        replyToComment: undefined,
        isDeleted: false,
      };

      vkMock.getComments.mockResolvedValue({
        count: 1,
        current_level_count: 1,
        can_post: 1,
        show_reply_button: 1,
        groups_can_post: 1,
        items: [rootComment],
        profiles: [],
        groups: [],
      });

      vkMock.getAuthors.mockResolvedValue([
        {
          id: 1000,
          first_name: 'Root',
          last_name: 'User',
        },
        {
          id: 2000,
          first_name: 'Child',
          last_name: 'User',
        },
      ]);

      const dto = { scope: ParsingScope.SELECTED, groupIds: [group.id], postLimit: 5 } as const;

      const result = await service.createParsingTask(dto);

      expect(result).toEqual({
        taskId: taskRecord.id,
        scope: ParsingScope.SELECTED,
        postLimit: 5,
        stats: { groups: 1, posts: 1, comments: 2, authors: 2 },
        skippedGroupsMessage: undefined,
      });

      expect(prismaMock.post.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ ownerId_vkPostId: { ownerId: post.owner_id, vkPostId: post.id } }),
        update: expect.objectContaining({ groupId: group.id, text: post.text }),
      }));

      expect(prismaMock.comment.upsert).toHaveBeenCalledTimes(2);
      const [firstCall, secondCall] = prismaMock.comment.upsert.mock.calls;
      expect(firstCall[0].update.threadItems).toEqual([
        {
          vkCommentId: childComment.vkCommentId,
          ownerId: childComment.ownerId,
          postId: childComment.postId,
          fromId: childComment.fromId,
          text: childComment.text,
          publishedAt: childComment.publishedAt.toISOString(),
          likesCount: childComment.likesCount ?? null,
          parentsStack: childComment.parentsStack ?? null,
          threadCount: childComment.threadCount ?? null,
          threadItems: null,
          attachments: childComment.attachments ?? null,
          replyToUser: childComment.replyToUser ?? null,
          replyToComment: childComment.replyToComment ?? null,
          isDeleted: childComment.isDeleted,
        },
      ]);
      expect(secondCall[0].update.threadItems).toBe(Prisma.JsonNull);

      expect(vkMock.getAuthors).toHaveBeenCalledWith([1000, 2000]);
      expect(prismaMock.author.upsert).toHaveBeenCalledTimes(2);

      const finalUpdateCall = prismaMock.task.update.mock.calls.at(-1);
      expect(finalUpdateCall[0].data.status).toBe('done');
      const description = JSON.parse(finalUpdateCall[0].data.description);
      expect(description.stats).toEqual({ groups: 1, posts: 1, comments: 2, authors: 2 });
      expect(description.skippedGroupsMessage).toBeUndefined();
    });

    it('should default to ALL scope when DTO omits scope and groupIds', async () => {
      const groups: MockGroupRecord[] = [
        { id: 1, vkId: 111, name: 'g1', wall: 1 },
        { id: 2, vkId: 222, name: 'g2', wall: 1 },
      ];
      prismaMock.group.findMany.mockResolvedValue(groups);
      vkMock.getGroupRecentPosts.mockResolvedValue([]);

      const result = await service.createParsingTask({} as any);

      expect(prismaMock.group.findMany).toHaveBeenCalledWith({ orderBy: { updatedAt: 'desc' } });
      expect(result.scope).toBe(ParsingScope.ALL);
      expect(result.stats).toEqual({ groups: groups.length, posts: 0, comments: 0, authors: 0 });
      expect(vkMock.getGroupRecentPosts).toHaveBeenCalledTimes(groups.length);
    });

    it('should default to SELECTED scope when groupIds are provided', async () => {
      const group: MockGroupRecord = { id: 7, vkId: 707, name: 'group', wall: 1 };
      prismaMock.group.findMany.mockResolvedValue([group]);
      vkMock.getGroupRecentPosts.mockResolvedValue([]);

      const result = await service.createParsingTask({ groupIds: [group.id] } as any);

      expect(result.scope).toBe(ParsingScope.SELECTED);
      expect(prismaMock.group.findMany).toHaveBeenCalledWith({ where: { id: { in: [group.id] } } });
    });

    it('should skip groups with disabled wall when VK API returns error 15', async () => {
      const group: MockGroupRecord = { id: 5, vkId: 999, name: 'hidden', wall: 1 };
      prismaMock.group.findMany.mockResolvedValue([group]);
      const apiError = new APIError({ error_code: 15, error_msg: 'Wall disabled', request_params: [] });
      vkMock.getGroupRecentPosts.mockRejectedValue(apiError);

      const result = await service.createParsingTask({} as any);

      expect(result.stats).toEqual({ groups: 0, posts: 0, comments: 0, authors: 0 });
      expect(result.skippedGroupsMessage).toContain(String(group.vkId));
      expect(prismaMock.group.update).toHaveBeenCalledWith({ where: { id: group.id }, data: { wall: 0 } });
    });

    it('should throw BadRequest when SELECTED scope has no groupIds', async () => {
      await expect(service.createParsingTask({ scope: ParsingScope.SELECTED } as any)).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });

    it('should throw NotFound when some selected groups are missing', async () => {
      prismaMock.group.findMany.mockResolvedValue([{ id: 1, vkId: 100, name: 'one', wall: 1 }]);

      await expect(service.createParsingTask({ scope: ParsingScope.SELECTED, groupIds: [1, 2] } as any)).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });

    it('should throw NotFound when no groups are available for ALL scope', async () => {
      prismaMock.group.findMany.mockResolvedValue([]);

      await expect(service.createParsingTask({} as any)).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });
  });

  describe('getTasks', () => {
    it('should return mapped tasks', async () => {
      const tasks: MockTaskRecord[] = [
        createTaskRecord({
          id: 1,
          description: JSON.stringify({ scope: ParsingScope.ALL, postLimit: 5, stats: { groups: 1, posts: 2, comments: 3, authors: 4 } }),
          completed: true,
          processedItems: 1,
          totalItems: 1,
          status: 'done',
        }),
      ];
      prismaMock.task.findMany.mockResolvedValue(tasks);

      const result = await service.getTasks();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        scope: ParsingScope.ALL,
        stats: { groups: 1, posts: 2, comments: 3, authors: 4 },
        status: 'done',
      });
    });

    it('should return empty array when no tasks exist', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);

      const result = await service.getTasks();

      expect(result).toEqual([]);
    });
  });

  describe('getTask', () => {
    it('should return task detail', async () => {
      const record = createTaskRecord({
        id: 3,
        description: JSON.stringify({ scope: ParsingScope.SELECTED, groupIds: [1], stats: { groups: 1, posts: 0, comments: 0, authors: 0 } }),
        completed: true,
        status: 'done',
      });
      prismaMock.task.findUnique.mockResolvedValue(record);

      const result = await service.getTask(3);

      expect(result).toMatchObject({
        id: 3,
        description: record.description,
        scope: ParsingScope.SELECTED,
        stats: { groups: 1, posts: 0, comments: 0, authors: 0 },
      });
    });

    it('should throw NotFound when task is missing', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(service.getTask(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
