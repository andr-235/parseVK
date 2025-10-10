jest.mock('vk-io', () => ({
  APIError: class MockApiError extends Error {
    code = 0;
  },
}));

import { NotFoundException } from '@nestjs/common';
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
});
