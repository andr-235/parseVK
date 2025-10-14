jest.mock('vk-io', () => ({
  APIError: class MockApiError extends Error {
    code = 0;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ParsingScope } from './dto/create-parsing-task.dto';
import type { ParsingTaskResult } from './interfaces/parsing-task-result.interface';
import type { TaskDetail, TaskSummary } from './interfaces/task.interface';

describe('TasksController', () => {
  let controller: TasksController;
  const tasksService = {
    createParsingTask: jest.fn<Promise<ParsingTaskResult>, any>(),
    getTasks: jest.fn<Promise<TaskSummary[]>, any>(),
    getTask: jest.fn<Promise<TaskDetail>, any>(),
    resumeTask: jest.fn<Promise<ParsingTaskResult>, any>(),
    refreshTask: jest.fn<Promise<ParsingTaskResult>, any>(),
  };

  beforeEach(async () => {
    tasksService.createParsingTask.mockReset();
    tasksService.getTasks.mockReset();
    tasksService.getTask.mockReset();
    tasksService.resumeTask.mockReset();
    tasksService.refreshTask.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: tasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('should delegate POST /parse to TasksService.createParsingTask', async () => {
    const dto = { scope: ParsingScope.ALL };
    const result: ParsingTaskResult = {
      id: 1,
      title: 'task',
      status: 'pending',
      completed: false,
      totalItems: 0,
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
    tasksService.createParsingTask.mockResolvedValue(result);

    await expect(controller.createParsingTask(dto as any)).resolves.toEqual(
      result,
    );
    expect(tasksService.createParsingTask).toHaveBeenCalledTimes(1);
    expect(tasksService.createParsingTask).toHaveBeenCalledWith(dto);
  });

  it('should delegate GET / to TasksService.getTasks', async () => {
    const summaries: TaskSummary[] = [
      {
        id: 1,
        title: 'task',
        status: 'pending',
        completed: false,
        totalItems: 0,
        processedItems: 0,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: null,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
      },
    ];
    tasksService.getTasks.mockResolvedValue(summaries);

    await expect(controller.getTasks()).resolves.toEqual(summaries);
    expect(tasksService.getTasks).toHaveBeenCalledTimes(1);
  });

  it('should delegate GET /:taskId to TasksService.getTask', async () => {
    const task: TaskDetail = {
      id: 1,
      title: 'task',
      status: 'done',
      completed: true,
      totalItems: 1,
      processedItems: 1,
      progress: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      scope: ParsingScope.SELECTED,
      groupIds: [1],
      postLimit: 10,
      stats: { groups: 1, posts: 1, comments: 1, authors: 1 },
      error: null,
      skippedGroupsMessage: null,
      description: 'desc',
    };
    tasksService.getTask.mockResolvedValue(task);

    await expect(controller.getTask(1)).resolves.toEqual(task);
    expect(tasksService.getTask).toHaveBeenCalledTimes(1);
    expect(tasksService.getTask).toHaveBeenCalledWith(1);
  });

  it('should delegate POST /:taskId/resume to TasksService.resumeTask', async () => {
    const taskId = 12;
    const result: ParsingTaskResult = {
      id: taskId,
      title: 'task',
      status: 'pending',
      completed: false,
      totalItems: 3,
      processedItems: 1,
      progress: 0.33,
      createdAt: new Date(),
      updatedAt: new Date(),
      scope: ParsingScope.SELECTED,
      groupIds: [1, 2, 3],
      postLimit: 10,
      stats: { groups: 3, posts: 10, comments: 20, authors: 5 },
      error: null,
      skippedGroupsMessage: null,
      description: '{}',
    };
    tasksService.resumeTask.mockResolvedValue(result);

    await expect(controller.resumeTask(taskId)).resolves.toEqual(result);
    expect(tasksService.resumeTask).toHaveBeenCalledTimes(1);
    expect(tasksService.resumeTask).toHaveBeenCalledWith(taskId);
  });

  it('should delegate POST /:taskId/check to TasksService.refreshTask', async () => {
    const taskId = 15;
    const result: ParsingTaskResult = {
      id: taskId,
      title: 'task',
      status: 'pending',
      completed: false,
      totalItems: 5,
      processedItems: 2,
      progress: 0.4,
      createdAt: new Date(),
      updatedAt: new Date(),
      scope: ParsingScope.ALL,
      groupIds: [],
      postLimit: 20,
      stats: null,
      error: null,
      skippedGroupsMessage: null,
      description: '{}',
    };

    tasksService.refreshTask.mockResolvedValue(result);

    await expect(controller.refreshTask(taskId)).resolves.toEqual(result);
    expect(tasksService.refreshTask).toHaveBeenCalledTimes(1);
    expect(tasksService.refreshTask).toHaveBeenCalledWith(taskId);
  });
});
