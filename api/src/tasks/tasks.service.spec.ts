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
import { TaskMapper } from './mappers/task.mapper';
import { TaskDescriptionParser } from './parsers/task-description.parser';
import { TaskContextBuilder } from './builders/task-context.builder';
import { TaskCancellationService } from './task-cancellation.service';

describe('TasksService', () => {
  let service: TasksService;
  let prismaMock: any;
  let runnerMock: any;
  let queueMock: jest.Mocked<ParsingQueueService>;
  let taskMapperMock: jest.Mocked<TaskMapper>;
  let descriptionParserMock: jest.Mocked<TaskDescriptionParser>;
  let contextBuilderMock: jest.Mocked<TaskContextBuilder>;
  let cancellationServiceMock: jest.Mocked<TaskCancellationService>;

  const createTaskRecord = (overrides: Partial<any> = {}) => ({
    id: 1,
    title: 'task',
    description: JSON.stringify({
      scope: ParsingScope.ALL,
      groupIds: [],
      postLimit: 10,
    }),
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
        delete: jest.fn(),
      },
    };

    runnerMock = {
      resolveGroups: jest.fn(),
      buildTaskTitle: jest.fn(),
    };

    queueMock = {
      enqueue: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<ParsingQueueService>;

    taskMapperMock = {
      mapToDetail: jest.fn(),
      mapToSummary: jest.fn(),
      parseTaskStatus: jest.fn(),
      resolveTaskStatus: jest.fn(),
    } as any;

    descriptionParserMock = {
      parse: jest.fn(),
      stringify: jest.fn(),
    } as any;

    contextBuilderMock = {
      buildResumeContext: jest.fn(),
    } as any;

    cancellationServiceMock = {
      requestCancel: jest.fn(),
      clear: jest.fn(),
    } as any;

    service = new TasksService(
      prismaMock,
      runnerMock,
      queueMock,
      cancellationServiceMock,
      taskMapperMock,
      descriptionParserMock,
      contextBuilderMock,
    );
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
        description: JSON.stringify({
          scope: ParsingScope.ALL,
          groupIds: [],
          postLimit: 5,
        }),
      });
      prismaMock.task.create.mockResolvedValue(createdTask);

      const parsed = {
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 5,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
        skippedGroupIds: [],
      };
      descriptionParserMock.parse.mockReturnValue(parsed);
      taskMapperMock.parseTaskStatus.mockReturnValue(null);
      taskMapperMock.resolveTaskStatus.mockReturnValue('pending');
      taskMapperMock.mapToDetail.mockReturnValue({
        id: 42,
        title: 'title',
        status: 'pending',
        completed: false,
        totalItems: groups.length,
        processedItems: 0,
        progress: 0,
        createdAt: createdTask.createdAt,
        updatedAt: createdTask.updatedAt,
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 5,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
        description: null,
      } as any);

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
      expect(descriptionParserMock.parse).toHaveBeenCalled();
      expect(taskMapperMock.mapToDetail).toHaveBeenCalled();
    });

    it('throws when groups are not available', async () => {
      runnerMock.resolveGroups.mockResolvedValue([]);

      await expect(service.createParsingTask({})).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.task.create).not.toHaveBeenCalled();
      expect(queueMock.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('getTasks', () => {
    it('maps task summaries using stored description', async () => {
      const stats: ParsingStats = {
        groups: 1,
        posts: 2,
        comments: 3,
        authors: 4,
      };
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

      descriptionParserMock.parse.mockImplementation((task: any) => {
        const parsed = JSON.parse(task.description || '{}');
        return {
          scope: parsed.scope || null,
          groupIds: parsed.groupIds || [],
          postLimit: parsed.postLimit || null,
          stats: parsed.stats || null,
          error: parsed.error || null,
          skippedGroupsMessage: parsed.skippedGroupsMessage || null,
          skippedGroupIds: parsed.skippedGroupIds || [],
        };
      });
      taskMapperMock.parseTaskStatus.mockReturnValue(null);
      taskMapperMock.resolveTaskStatus.mockReturnValue('pending');
      taskMapperMock.mapToSummary.mockImplementation(
        (task: any, parsed: any, status: any) => ({
          id: task.id,
          title: task.title,
          status,
          completed: task.completed || false,
          totalItems: task.totalItems || 0,
          processedItems: task.processedItems || 0,
          progress: task.progress || 0,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          scope: parsed.scope,
          groupIds: parsed.groupIds,
          postLimit: parsed.postLimit,
          stats: parsed.stats,
          error: parsed.error,
          skippedGroupsMessage: parsed.skippedGroupsMessage,
        }),
      );

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

      const parsed = {
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 10,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
        skippedGroupIds: [],
      };
      descriptionParserMock.parse.mockReturnValue(parsed);
      taskMapperMock.parseTaskStatus.mockReturnValue(null);
      taskMapperMock.resolveTaskStatus.mockReturnValue('pending');
      taskMapperMock.mapToDetail.mockReturnValue({
        id: 7,
        title: task.title,
        status: 'pending',
        completed: false,
        totalItems: 0,
        processedItems: 0,
        progress: 0,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 10,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
        description: task.description,
      } as any);

      const result = await service.getTask(7);

      expect(result.id).toBe(7);
      expect(result.description).toBe(task.description);
    });

    it('throws when task does not exist', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(service.getTask(123)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('resumeTask', () => {
    it('enqueues task again and clears error data', async () => {
      const stats: ParsingStats = {
        groups: 2,
        posts: 4,
        comments: 6,
        authors: 1,
      };
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
      taskMapperMock.parseTaskStatus.mockReturnValue('failed');
      contextBuilderMock.buildResumeContext.mockResolvedValue({
        scope: ParsingScope.SELECTED,
        groupIds: [11, 12, 13],
        postLimit: 20,
        parsed: {
          scope: ParsingScope.SELECTED,
          groupIds: [11, 12, 13],
          postLimit: 20,
          stats,
          error: null,
          skippedGroupsMessage: 'Пропущены группы с отключенной стеной: 999',
          skippedGroupIds: [999],
        },
        totalItems: 3,
        processedItems: 1,
        progress: 1 / 3,
      });
      descriptionParserMock.stringify.mockReturnValue(
        JSON.stringify({
          scope: ParsingScope.SELECTED,
          groupIds: [11, 12, 13],
          postLimit: 20,
          stats,
          skippedGroupsMessage: 'Пропущены группы с отключенной стеной: 999',
          skippedGroupIds: [999],
        }),
      );

      prismaMock.task.update.mockImplementation(async ({ data }: any) => ({
        ...task,
        ...data,
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      }));

      taskMapperMock.mapToDetail.mockReturnValue({
        id: 15,
        title: task.title,
        status: 'pending',
        completed: false,
        totalItems: 3,
        processedItems: 1,
        progress: 1 / 3,
        createdAt: task.createdAt,
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        scope: ParsingScope.SELECTED,
        groupIds: [11, 12, 13],
        postLimit: 20,
        stats,
        error: null,
        skippedGroupsMessage: 'Пропущены группы с отключенной стеной: 999',
        description: task.description,
      } as any);

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
        description: JSON.stringify({
          scope: ParsingScope.ALL,
          groupIds: [],
          postLimit: 10,
        }),
      });
      prismaMock.task.findUnique.mockResolvedValue(task);
      taskMapperMock.parseTaskStatus.mockReturnValue('running');
      contextBuilderMock.buildResumeContext.mockResolvedValue({
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 10,
        parsed: {
          scope: ParsingScope.ALL,
          groupIds: [],
          postLimit: 10,
          stats: null,
          error: null,
          skippedGroupsMessage: null,
          skippedGroupIds: [],
        },
        totalItems: 10,
        processedItems: 3,
        progress: 3 / 10,
      });
      descriptionParserMock.stringify.mockReturnValue(
        JSON.stringify({
          scope: ParsingScope.ALL,
          groupIds: [],
          postLimit: 10,
        }),
      );
      prismaMock.task.update.mockImplementation(async ({ data }: any) => ({
        ...task,
        ...data,
      }));
      taskMapperMock.mapToDetail.mockReturnValue({
        id: 21,
        title: task.title,
        status: 'pending',
        completed: false,
        totalItems: 10,
        processedItems: 3,
        progress: 3 / 10,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 10,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
        description: task.description,
      } as any);

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
      taskMapperMock.parseTaskStatus.mockReturnValue('pending');
      contextBuilderMock.buildResumeContext.mockResolvedValue({
        scope: ParsingScope.SELECTED,
        groupIds: [10, 11],
        postLimit: 15,
        parsed: {
          scope: ParsingScope.SELECTED,
          groupIds: [10, 11],
          postLimit: 15,
          stats: null,
          error: null,
          skippedGroupsMessage: null,
          skippedGroupIds: [],
        },
        totalItems: 5,
        processedItems: 0,
        progress: 0,
      });
      descriptionParserMock.stringify.mockReturnValue(
        JSON.stringify({
          scope: ParsingScope.SELECTED,
          groupIds: [10, 11],
          postLimit: 15,
        }),
      );
      prismaMock.task.update.mockImplementation(async ({ data }: any) => ({
        ...task,
        ...data,
      }));
      taskMapperMock.mapToDetail.mockReturnValue({
        id: 22,
        title: task.title,
        status: 'pending',
        completed: false,
        totalItems: 5,
        processedItems: 0,
        progress: 0,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        scope: ParsingScope.SELECTED,
        groupIds: [10, 11],
        postLimit: 15,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
        description: task.description,
      } as any);

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
      taskMapperMock.parseTaskStatus.mockReturnValue('done');

      await expect(service.resumeTask(2)).rejects.toBeInstanceOf(
        BadRequestException,
      );
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
      taskMapperMock.parseTaskStatus.mockReturnValue('failed');
      contextBuilderMock.buildResumeContext.mockRejectedValue(
        new NotFoundException('Нет доступных групп для парсинга'),
      );

      await expect(service.resumeTask(3)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.task.update).not.toHaveBeenCalled();
      expect(queueMock.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('refreshTask', () => {
    it('marks task as done when processed equals total and skips requeue', async () => {
      const task = createTaskRecord({
        id: 33,
        status: 'running',
        processedItems: 3,
        totalItems: 3,
        description: JSON.stringify({
          scope: ParsingScope.SELECTED,
          groupIds: [1, 2, 3],
          postLimit: 10,
        }),
      });

      prismaMock.task.findUnique.mockResolvedValue(task);
      contextBuilderMock.buildResumeContext.mockResolvedValue({
        scope: ParsingScope.SELECTED,
        groupIds: [1, 2, 3],
        postLimit: 10,
        parsed: {
          scope: ParsingScope.SELECTED,
          groupIds: [1, 2, 3],
          postLimit: 10,
          stats: null,
          error: null,
          skippedGroupsMessage: null,
          skippedGroupIds: [],
        },
        totalItems: 3,
        processedItems: 3,
        progress: 1,
      });
      descriptionParserMock.stringify.mockReturnValue(
        JSON.stringify({
          scope: ParsingScope.SELECTED,
          groupIds: [1, 2, 3],
          postLimit: 10,
        }),
      );

      prismaMock.task.update.mockImplementation(async ({ data }: any) => ({
        ...task,
        ...data,
      }));

      taskMapperMock.mapToDetail.mockReturnValue({
        id: 33,
        title: task.title,
        status: 'done',
        completed: true,
        totalItems: 3,
        processedItems: 3,
        progress: 1,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        scope: ParsingScope.SELECTED,
        groupIds: [1, 2, 3],
        postLimit: 10,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
        description: task.description,
      } as any);

      const result = await service.refreshTask(task.id);

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: task.id },
        data: expect.objectContaining({
          status: 'done',
          completed: true,
          progress: 1,
          processedItems: 3,
          totalItems: 3,
        }),
      });
      expect(queueMock.enqueue).not.toHaveBeenCalled();
      expect(result.status).toBe('done');
      expect(result.completed).toBe(true);
    });

    it('requeues task when progress is incomplete', async () => {
      const task = createTaskRecord({
        id: 34,
        status: 'running',
        processedItems: 1,
        totalItems: 3,
        description: JSON.stringify({
          scope: ParsingScope.ALL,
          groupIds: [],
          postLimit: 5,
        }),
      });

      prismaMock.task.findUnique.mockResolvedValue(task);
      contextBuilderMock.buildResumeContext.mockResolvedValue({
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 5,
        parsed: {
          scope: ParsingScope.ALL,
          groupIds: [],
          postLimit: 5,
          stats: null,
          error: null,
          skippedGroupsMessage: null,
          skippedGroupIds: [],
        },
        totalItems: 3,
        processedItems: 1,
        progress: 1 / 3,
      });
      descriptionParserMock.stringify.mockReturnValue(
        JSON.stringify({
          scope: ParsingScope.ALL,
          groupIds: [],
          postLimit: 5,
        }),
      );

      prismaMock.task.update.mockImplementation(async ({ data }: any) => ({
        ...task,
        ...data,
      }));

      taskMapperMock.mapToDetail.mockReturnValue({
        id: 34,
        title: task.title,
        status: 'pending',
        completed: false,
        totalItems: 3,
        processedItems: 1,
        progress: 1 / 3,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 5,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
        description: task.description,
      } as any);

      const result = await service.refreshTask(task.id);

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: task.id },
        data: expect.objectContaining({
          status: 'pending',
          completed: false,
          processedItems: 1,
          totalItems: 3,
        }),
      });
      expect(queueMock.enqueue).toHaveBeenCalledWith({
        taskId: task.id,
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 5,
      });
      expect(result.status).toBe('pending');
    });
  });
});
