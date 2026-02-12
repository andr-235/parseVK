import { vi } from 'vitest';

vi.mock('vk-io', () => ({
  APIError: class MockApiError extends Error {
    code = 0;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TasksController } from './tasks.controller.js';
import { ParsingScope } from './dto/create-parsing-task.dto.js';
import type { ParsingTaskResult } from './interfaces/parsing-task-result.interface.js';
import type { TaskDetail, TaskSummary } from './interfaces/task.interface.js';
import type { TaskAuditLog } from './interfaces/task-audit-log.interface.js';
import {
  CreateParsingTaskCommand,
  ResumeTaskCommand,
  DeleteTaskCommand,
  RefreshTaskCommand,
} from './commands/index.js';
import {
  GetTasksQuery,
  GetTaskByIdQuery,
  GetTaskAuditLogQuery,
} from './queries/index.js';

describe('TasksController', () => {
  let controller: TasksController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  const mockCommandBus = {
    execute: vi.fn(),
  };

  const mockQueryBus = {
    execute: vi.fn(),
  };

  beforeEach(async () => {
    mockCommandBus.execute.mockReset();
    mockQueryBus.execute.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /parse', () => {
    it('should execute CreateParsingTaskCommand', async () => {
      const dto = {
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 10,
      };

      const mockResult: ParsingTaskResult = {
        id: 1,
        title: 'Test Task',
        status: 'pending',
        completed: false,
        totalItems: 5,
        processedItems: 0,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 10,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
        description: null,
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      const result = await controller.createParsingTask(dto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateParsingTaskCommand),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /', () => {
    it('should execute GetTasksQuery', async () => {
      const query = { page: 1, limit: 20 };
      const mockResult = {
        tasks: [] as TaskSummary[],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasMore: false,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getTasks(query);

      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetTasksQuery));
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /:taskId', () => {
    it('should execute GetTaskByIdQuery', async () => {
      const taskId = 1;
      const mockResult: TaskDetail = {
        id: 1,
        title: 'Test Task',
        status: 'pending',
        completed: false,
        totalItems: 5,
        processedItems: 0,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 10,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
        description: null,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getTask(taskId);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetTaskByIdQuery),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /:taskId/audit-log', () => {
    it('should execute GetTaskAuditLogQuery', async () => {
      const taskId = 1;
      const mockResult: TaskAuditLog[] = [
        {
          id: 1,
          taskId: 1,
          eventType: 'created',
          eventData: { scope: 'all' },
          createdAt: new Date(),
        },
      ];

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getTaskAuditLog(taskId);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetTaskAuditLogQuery),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('POST /:taskId/resume', () => {
    it('should execute ResumeTaskCommand', async () => {
      const taskId = 1;
      const mockResult: ParsingTaskResult = {
        id: 1,
        title: 'Test Task',
        status: 'pending',
        completed: false,
        totalItems: 5,
        processedItems: 0,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 10,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
        description: null,
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      const result = await controller.resumeTask(taskId);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(ResumeTaskCommand),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('POST /:taskId/check', () => {
    it('should execute RefreshTaskCommand', async () => {
      const taskId = 1;
      const mockResult: ParsingTaskResult = {
        id: 1,
        title: 'Test Task',
        status: 'done',
        completed: true,
        totalItems: 5,
        processedItems: 5,
        progress: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 10,
        stats: { groups: 5, posts: 10, comments: 20, authors: 15 },
        error: null,
        skippedGroupsMessage: null,
        description: null,
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      const result = await controller.refreshTask(taskId);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RefreshTaskCommand),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('DELETE /:taskId', () => {
    it('should execute DeleteTaskCommand', async () => {
      const taskId = 1;

      mockCommandBus.execute.mockResolvedValue(undefined);

      await controller.deleteTask(taskId);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteTaskCommand),
      );
    });
  });
});
