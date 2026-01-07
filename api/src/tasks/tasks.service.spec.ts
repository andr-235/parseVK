/* eslint-disable @typescript-eslint/unbound-method */
jest.mock('vk-io', () => ({
  APIError: class MockApiError extends Error {
    code = 0;
  },
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Task } from '@prisma/client';
import { TasksService } from './tasks.service';
import { ParsingScope } from './dto/create-parsing-task.dto';
import type { ParsingStats } from './interfaces/parsing-stats.interface';
import { ParsingQueueService } from './parsing-queue.service';
import { TaskMapper } from './mappers/task.mapper';
import { TaskDescriptionParser } from './parsers/task-description.parser';
import { TaskContextBuilder } from './builders/task-context.builder';
import { TaskCancellationService } from './task-cancellation.service';
import type { ITasksRepository } from './interfaces/tasks-repository.interface';
import { ParsingTaskRunner } from './parsing-task.runner';
import type { ParsedTaskDescription } from './parsers/task-description.parser';
import type {
  TaskDetail,
  TaskSummary,
  TaskStatus,
} from './interfaces/task.interface';

describe('TasksService', () => {
  let service: TasksService;
  let repositoryMock: jest.Mocked<ITasksRepository>;
  let runnerMock: jest.Mocked<ParsingTaskRunner>;
  let queueMock: jest.Mocked<ParsingQueueService>;
  let taskMapperMock: jest.Mocked<TaskMapper>;
  let descriptionParserMock: jest.Mocked<TaskDescriptionParser>;
  let contextBuilderMock: jest.Mocked<TaskContextBuilder>;
  let cancellationServiceMock: jest.Mocked<TaskCancellationService>;

  const createTaskRecord = (overrides: Partial<Task> = {}): Task => ({
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
    repositoryMock = {
      create: jest.fn<Promise<Task>, [unknown]>(),
      findMany: jest.fn<Promise<Task[]>, [unknown?]>(),
      findUnique: jest.fn<Promise<Task>, [{ id: number }]>(),
      update: jest.fn<Promise<Task>, [{ id: number }, unknown]>(),
      delete: jest.fn<Promise<void>, [{ id: number }]>(),
      count: jest.fn<Promise<number>, []>(),
    } as jest.Mocked<ITasksRepository>;

    runnerMock = {
      execute: jest.fn(),
      resolveGroups: jest.fn(),
      buildTaskTitle: jest.fn(),
    } as unknown as jest.Mocked<ParsingTaskRunner>;

    queueMock = {
      enqueue: jest.fn(),
      remove: jest.fn(),
      getStats: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
    } as unknown as jest.Mocked<ParsingQueueService>;

    taskMapperMock = {
      mapToDetail: jest.fn(),
      mapToSummary: jest.fn(),
      parseTaskStatus: jest.fn(),
      resolveTaskStatus: jest.fn(),
    } as jest.Mocked<TaskMapper>;

    descriptionParserMock = {
      parse: jest.fn(),
      stringify: jest.fn(),
      createEmpty: jest.fn(),
      parseScope: jest.fn(),
      parseGroupIds: jest.fn(),
      parseSkippedGroupIds: jest.fn(),
      parsePostLimit: jest.fn(),
      parseStats: jest.fn(),
      parseNumericField: jest.fn(),
    } as unknown as jest.Mocked<TaskDescriptionParser>;

    contextBuilderMock = {
      buildResumeContext: jest.fn(),
      runner: {} as unknown as ParsingTaskRunner,
      parser: {} as unknown as TaskDescriptionParser,
      normalizePostLimit: jest.fn(),
    } as unknown as jest.Mocked<TaskContextBuilder>;

    cancellationServiceMock = {
      requestCancel: jest.fn(),
      clear: jest.fn(),
      isCancelled: jest.fn(),
      throwIfCancelled: jest.fn(),
      cancelledTasks: new Set<number>(),
    } as unknown as jest.Mocked<TaskCancellationService>;

    service = new TasksService(
      repositoryMock,
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
      repositoryMock.create.mockResolvedValue(createdTask);

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
      } as TaskDetail);

      const result = await service.createParsingTask({ postLimit: 5 });

      expect(repositoryMock.create.mock.calls[0]?.[0]).toMatchObject({
        title: 'title',
        totalItems: groups.length,
        status: 'pending',
      });
      expect(queueMock.enqueue.mock.calls[0]?.[0]).toEqual({
        taskId: createdTask.id,
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 5,
      });
      expect(result.id).toBe(createdTask.id);
      expect(result.status).toBe('pending');
      expect(descriptionParserMock.parse.mock.calls.length).toBeGreaterThan(0);
      expect(taskMapperMock.mapToDetail.mock.calls.length).toBeGreaterThan(0);
    });

    it('throws when groups are not available', async () => {
      runnerMock.resolveGroups.mockResolvedValue([]);

      await expect(service.createParsingTask({})).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repositoryMock.create.mock.calls.length).toBe(0);
      expect(queueMock.enqueue.mock.calls.length).toBe(0);
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
      repositoryMock.findMany.mockResolvedValue(tasks);
      repositoryMock.count.mockResolvedValue(1);

      descriptionParserMock.parse.mockImplementation((task: Task) => {
        const parsed = JSON.parse(task.description || '{}') as Record<
          string,
          unknown
        >;
        return {
          scope: (parsed.scope as ParsingScope | undefined) || null,
          groupIds: (parsed.groupIds as number[] | undefined) || [],
          postLimit: (parsed.postLimit as number | undefined) || null,
          stats: (parsed.stats as ParsingStats | undefined) || null,
          error: (parsed.error as string | undefined) || null,
          skippedGroupsMessage:
            (parsed.skippedGroupsMessage as string | undefined) || null,
          skippedGroupIds:
            (parsed.skippedGroupIds as number[] | undefined) || [],
        } as ParsedTaskDescription;
      });
      taskMapperMock.parseTaskStatus.mockReturnValue(null);
      taskMapperMock.resolveTaskStatus.mockReturnValue('pending');
      taskMapperMock.mapToSummary.mockImplementation(
        (
          task: Task,
          parsed: ParsedTaskDescription,
          status: TaskStatus,
        ): TaskSummary => ({
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

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0]).toEqual(
        expect.objectContaining({
          id: 5,
          scope: ParsingScope.SELECTED,
          groupIds: [1, 2],
          postLimit: 3,
          stats,
        }),
      );
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getTask', () => {
    it('returns detailed task data', async () => {
      const task = createTaskRecord({ id: 7 });
      (repositoryMock.findUnique as jest.Mock).mockResolvedValue(task);

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
      } as TaskDetail);

      const result = await service.getTask(7);

      expect(result.id).toBe(7);
      expect(result.description).toBe(task.description);
    });

    it('throws when task does not exist', async () => {
      class MockNotFoundError extends Error {
        code = 'P2025';
        meta = { modelName: 'Task' };
      }
      (repositoryMock.findUnique as jest.Mock).mockRejectedValue(
        new MockNotFoundError('Record to find does not exist.'),
      );

      await expect(service.getTask(123)).rejects.toThrow();
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

      (repositoryMock.findUnique as jest.Mock).mockResolvedValue(task);
      taskMapperMock.parseTaskStatus.mockReturnValue('failed');
      (contextBuilderMock.buildResumeContext as jest.Mock).mockResolvedValue({
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

      repositoryMock.update.mockImplementation((where, data) => {
        return Promise.resolve({
          ...task,
          ...data,
          updatedAt: new Date('2024-01-02T00:00:00Z'),
        } as Task);
      });

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
      } as TaskDetail);

      const result = await service.resumeTask(task.id);

      expect(repositoryMock.update.mock.calls[0]?.[0]).toEqual({ id: task.id });
      expect(repositoryMock.update.mock.calls[0]?.[1]).toMatchObject({
        status: 'pending',
        completed: false,
        processedItems: 1,
        totalItems: 3,
      });

      const updateCall = repositoryMock.update.mock.calls[0];
      if (updateCall && updateCall[1]) {
        const savedDescription = JSON.parse(
          (updateCall[1] as { description?: string }).description || '{}',
        ) as Record<string, unknown>;
        expect(savedDescription.error).toBeUndefined();
        expect(savedDescription.groupIds).toEqual([11, 12, 13]);
        expect(savedDescription.skippedGroupIds).toEqual([999]);
      }

      expect(queueMock.enqueue.mock.calls[0]?.[0]).toEqual({
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
      (repositoryMock.findUnique as jest.Mock).mockResolvedValue(task);
      taskMapperMock.parseTaskStatus.mockReturnValue('running');
      (contextBuilderMock.buildResumeContext as jest.Mock).mockResolvedValue({
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
      repositoryMock.update.mockImplementation((where, data) => {
        return Promise.resolve({
          ...task,
          ...data,
        } as Task);
      });
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
      } as TaskDetail);

      await expect(service.resumeTask(task.id)).resolves.toEqual(
        expect.objectContaining({
          id: task.id,
          status: 'pending',
        }),
      );

      expect(repositoryMock.update.mock.calls[0]?.[0]).toEqual({ id: task.id });
      expect(repositoryMock.update.mock.calls[0]?.[1]).toMatchObject({
        status: 'pending',
      });
      expect(queueMock.enqueue.mock.calls[0]?.[0]).toEqual({
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
      (repositoryMock.findUnique as jest.Mock).mockResolvedValue(task);
      taskMapperMock.parseTaskStatus.mockReturnValue('pending');
      (contextBuilderMock.buildResumeContext as jest.Mock).mockResolvedValue({
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
      repositoryMock.update.mockImplementation((where, data) => {
        return Promise.resolve({
          ...task,
          ...data,
        } as Task);
      });
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
      } as TaskDetail);

      await expect(service.resumeTask(task.id)).resolves.toEqual(
        expect.objectContaining({
          id: task.id,
          status: 'pending',
        }),
      );

      expect(queueMock.enqueue.mock.calls[0]?.[0]).toEqual({
        taskId: task.id,
        scope: ParsingScope.SELECTED,
        groupIds: [10, 11],
        postLimit: 15,
      });
    });

    it('throws when task already completed', async () => {
      const task = createTaskRecord({ id: 2, status: 'done', completed: true });
      (repositoryMock.findUnique as jest.Mock).mockResolvedValue(task);
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

      (repositoryMock.findUnique as jest.Mock).mockResolvedValue(task);
      taskMapperMock.parseTaskStatus.mockReturnValue('failed');
      contextBuilderMock.buildResumeContext.mockRejectedValue(
        new NotFoundException('Нет доступных групп для парсинга'),
      );

      await expect(service.resumeTask(3)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repositoryMock.update.mock.calls.length).toBe(0);
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

      const findUniqueMock = repositoryMock.findUnique as jest.Mock<
        Promise<Task | null>,
        [{ id: number }]
      >;
      void findUniqueMock.mockResolvedValue(task);
      const buildResumeContextMock =
        contextBuilderMock.buildResumeContext as jest.Mock;
      void buildResumeContextMock.mockResolvedValue({
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

      repositoryMock.update.mockImplementation((where, data) => {
        return Promise.resolve({
          ...task,
          ...data,
        } as Task);
      });

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
      } as TaskDetail);

      const result = await service.refreshTask(task.id);

      expect(repositoryMock.update.mock.calls[0]?.[0]).toEqual({ id: task.id });
      expect(repositoryMock.update.mock.calls[0]?.[1]).toMatchObject({
        status: 'done',
        completed: true,
        progress: 1,
        processedItems: 3,
        totalItems: 3,
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

      const findUniqueMock = repositoryMock.findUnique as jest.Mock<
        Promise<Task | null>,
        [{ id: number }]
      >;
      void findUniqueMock.mockResolvedValue(task);
      const buildResumeContextMock =
        contextBuilderMock.buildResumeContext as jest.Mock;
      void buildResumeContextMock.mockResolvedValue({
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

      repositoryMock.update.mockImplementation((where, data) => {
        return Promise.resolve({
          ...task,
          ...data,
        } as Task);
      });

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
      } as TaskDetail);

      const result = await service.refreshTask(task.id);

      expect(repositoryMock.update).toHaveBeenCalledWith(
        { id: task.id },
        expect.objectContaining({
          status: 'pending',
          completed: false,
          processedItems: 1,
          totalItems: 3,
        }),
      );
      expect(queueMock.enqueue.mock.calls[0]?.[0]).toEqual({
        taskId: task.id,
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 5,
      });
      expect(result.status).toBe('pending');
    });
  });
});
