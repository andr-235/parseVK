jest.mock('vk-io', () => ({
  APIError: class MockApiError extends Error {
    code = 0;
  },
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ParsingScope } from './dto/create-parsing-task.dto';
import type { ParsingStats } from './interfaces/parsing-stats.interface';
import { ParsingQueueService } from './parsing-queue.service';

describe('TasksService', () => {
  let service: TasksService;
  let prismaMock: any;
  let runnerMock: any;
  let queueMock: jest.Mocked<ParsingQueueService>;

  const createTaskRecord = (overrides: Partial<any> = {}) => ({
    id: 1,
    title: 'task',
    description: JSON.stringify({ scope: ParsingScope.ALL, groupIds: [], postLimit: 10 }),
    completed: false,
    totalItems: 0,
    processedItems: 0,
    progress: 0,
    status: 'pending',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    prismaMock = {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    runnerMock = {
      resolveGroups: jest.fn(),
      buildTaskTitle: jest.fn(),
    };

    queueMock = {
      enqueue: jest.fn(),
    } as unknown as jest.Mocked<ParsingQueueService>;

    service = new TasksService(prismaMock, runnerMock, queueMock);
  });

  describe('createParsingTask', () => {
    it('creates a task, enqueues a job and returns mapped detail', async () => {
      const groups = [{ id: 10, vkId: 100, name: 'Group', wall: 1 }];
      runnerMock.resolveGroups.mockResolvedValue(groups);
      runnerMock.buildTaskTitle.mockReturnValue('title');

      const createdTask = createTaskRecord({
        id: 42,
        title: 'title',
        totalItems: groups.length,
        description: JSON.stringify({ scope: ParsingScope.ALL, groupIds: [], postLimit: 5 }),
      });
      prismaMock.task.create.mockResolvedValue(createdTask);

      const result = await service.createParsingTask({ postLimit: 5 });

      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'title',
          totalItems: groups.length,
          status: 'pending',
        }),
      });
      expect(queueMock.enqueue).toHaveBeenCalledWith({
        taskId: createdTask.id,
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 5,
      });
      expect(result.id).toBe(createdTask.id);
      expect(result.status).toBe('pending');
    });

    it('throws when groups are not available', async () => {
      runnerMock.resolveGroups.mockResolvedValue([]);

      await expect(service.createParsingTask({})).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.task.create).not.toHaveBeenCalled();
      expect(queueMock.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('getTasks', () => {
    it('maps task summaries using stored description', async () => {
      const stats: ParsingStats = { groups: 1, posts: 2, comments: 3, authors: 4 };
      const tasks = [
        createTaskRecord({
          id: 5,
          totalItems: 2,
          processedItems: 1,
          description: JSON.stringify({
            scope: ParsingScope.SELECTED,
            groupIds: [1, 2],
            postLimit: 3,
            stats,
          }),
        }),
      ];
      prismaMock.task.findMany.mockResolvedValue(tasks);

      const result = await service.getTasks();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 5,
          scope: ParsingScope.SELECTED,
          groupIds: [1, 2],
          postLimit: 3,
          stats,
        }),
      );
    });
  });

  describe('getTask', () => {
    it('returns detailed task data', async () => {
      const task = createTaskRecord({ id: 7 });
      prismaMock.task.findUnique.mockResolvedValue(task);

      const result = await service.getTask(7);

      expect(result.id).toBe(7);
      expect(result.description).toBe(task.description);
    });

    it('throws when task does not exist', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(service.getTask(123)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('resumeTask', () => {
    it('enqueues task again and clears error data', async () => {
      const stats: ParsingStats = { groups: 2, posts: 4, comments: 6, authors: 1 };
      const task = createTaskRecord({
        id: 15,
        status: 'failed',
        processedItems: 1,
        totalItems: 3,
        description: JSON.stringify({
          scope: ParsingScope.SELECTED,
          groupIds: [11, 12, 13],
          postLimit: 20,
          stats,
          error: 'Network error',
          skippedGroupsMessage: 'Пропущены группы с отключенной стеной: 999',
          skippedGroupIds: [999],
        }),
      });

      prismaMock.task.findUnique.mockResolvedValue(task);
      runnerMock.resolveGroups.mockResolvedValue([
        { id: 50, vkId: 500, name: 'Group A', wall: 1 },
        { id: 51, vkId: 501, name: 'Group B', wall: 1 },
        { id: 52, vkId: 502, name: 'Group C', wall: 1 },
      ]);

      prismaMock.task.update.mockImplementation(async ({ data }: any) => ({
        ...task,
        ...data,
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      }));

      const result = await service.resumeTask(task.id);

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: task.id },
        data: expect.objectContaining({
          status: 'pending',
          completed: false,
          processedItems: 1,
          totalItems: 3,
        }),
      });

      const updateCall = prismaMock.task.update.mock.calls[0][0];
      const savedDescription = JSON.parse(updateCall.data.description);
      expect(savedDescription.error).toBeUndefined();
      expect(savedDescription.groupIds).toEqual([11, 12, 13]);
      expect(savedDescription.skippedGroupIds).toEqual([999]);

      expect(queueMock.enqueue).toHaveBeenCalledWith({
        taskId: task.id,
        scope: ParsingScope.SELECTED,
        groupIds: [11, 12, 13],
        postLimit: 20,
      });

      expect(result.status).toBe('pending');
      expect(result.groupIds).toEqual([11, 12, 13]);
    });

    it('requeues task even if status is running', async () => {
      const task = createTaskRecord({
        id: 21,
        status: 'running',
        processedItems: 3,
        totalItems: 10,
      });
      prismaMock.task.findUnique.mockResolvedValue(task);
      runnerMock.resolveGroups.mockResolvedValue([
        { id: 1, vkId: 100, name: 'Group', wall: 1 },
        { id: 2, vkId: 200, name: 'Group 2', wall: 1 },
      ]);
      prismaMock.task.update.mockImplementation(async ({ data }: any) => ({
        ...task,
        ...data,
      }));

      await expect(service.resumeTask(task.id)).resolves.toEqual(
        expect.objectContaining({
          id: task.id,
          status: 'pending',
        }),
      );

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: task.id },
        data: expect.objectContaining({
          status: 'pending',
        }),
      });
      expect(queueMock.enqueue).toHaveBeenCalledWith({
        taskId: task.id,
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 10,
      });
    });

    it('allows resuming task in pending state', async () => {
      const task = createTaskRecord({
        id: 22,
        status: 'pending',
        processedItems: 0,
        totalItems: 5,
        description: JSON.stringify({
          scope: ParsingScope.SELECTED,
          groupIds: [10, 11],
          postLimit: 15,
        }),
      });
      prismaMock.task.findUnique.mockResolvedValue(task);
      runnerMock.resolveGroups.mockResolvedValue([
        { id: 10, vkId: 500, name: 'Group 10', wall: 1 },
        { id: 11, vkId: 501, name: 'Group 11', wall: 1 },
      ]);
      prismaMock.task.update.mockImplementation(async ({ data }: any) => ({
        ...task,
        ...data,
      }));

      await expect(service.resumeTask(task.id)).resolves.toEqual(
        expect.objectContaining({
          id: task.id,
          status: 'pending',
        }),
      );

      expect(queueMock.enqueue).toHaveBeenCalledWith({
        taskId: task.id,
        scope: ParsingScope.SELECTED,
        groupIds: [10, 11],
        postLimit: 15,
      });
    });

    it('throws when task already completed', async () => {
      const task = createTaskRecord({ id: 2, status: 'done', completed: true });
      prismaMock.task.findUnique.mockResolvedValue(task);

      await expect(service.resumeTask(2)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when no groups are available', async () => {
      const task = createTaskRecord({
        id: 3,
        status: 'failed',
        description: JSON.stringify({
          scope: ParsingScope.ALL,
          groupIds: [],
          postLimit: 10,
        }),
      });

      prismaMock.task.findUnique.mockResolvedValue(task);
      runnerMock.resolveGroups.mockResolvedValue([]);

      await expect(service.resumeTask(3)).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.task.update).not.toHaveBeenCalled();
      expect(queueMock.enqueue).not.toHaveBeenCalled();
    });
  });
});
