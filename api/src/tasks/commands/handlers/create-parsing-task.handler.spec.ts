import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { CreateParsingTaskHandler } from './create-parsing-task.handler.js';
import { CreateParsingTaskCommand } from '../impl/create-parsing-task.command.js';
import {
  ParsingScope,
  ParsingTaskMode,
} from '@/tasks/dto/create-parsing-task.dto.js';
import { TaskGroupResolverService } from '@/tasks/services/task-group-resolver.service.js';
import { ParsingQueueService } from '@/tasks/parsing-queue.service.js';
import { TaskMapper } from '@/tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '@/tasks/parsers/task-description.parser.js';
import type { ITasksRepository } from '@/tasks/interfaces/tasks-repository.interface.js';
import type { ParsingGroupRecord } from '@/tasks/interfaces/parsing-task-repository.interface.js';
import type { TaskRecord } from '@/tasks/types/task-record.type.js';

describe('CreateParsingTaskHandler', () => {
  let repository: Pick<ITasksRepository, 'create'>;
  let groupResolver: Pick<
    TaskGroupResolverService,
    'resolveGroups' | 'buildTaskTitle'
  >;
  let parsingQueue: Pick<ParsingQueueService, 'enqueue'>;
  let eventBus: Pick<EventBus, 'publish'>;
  let taskMapper: Pick<TaskMapper, 'parseTaskStatus' | 'resolveTaskStatus' | 'mapToDetail'>;
  let descriptionParser: TaskDescriptionParser;
  let handler: CreateParsingTaskHandler;

  const groups: ParsingGroupRecord[] = [
    { id: 1, vkId: 123, name: 'Test group', wall: 1 },
  ];

  const createdTask: TaskRecord = {
    id: 10,
    title: 'placeholder',
    description: null,
    completed: false,
    totalItems: 1,
    processedItems: 0,
    progress: 0,
    status: 'pending',
    createdAt: new Date('2026-03-16T00:00:00.000Z'),
    updatedAt: new Date('2026-03-16T00:00:00.000Z'),
  };

  beforeEach(() => {
    repository = {
      create: vi.fn().mockResolvedValue(createdTask),
    };
    groupResolver = {
      resolveGroups: vi.fn().mockResolvedValue(groups),
      buildTaskTitle: vi.fn().mockReturnValue('Перепроверка группы: Test group'),
    };
    parsingQueue = {
      enqueue: vi.fn().mockResolvedValue(undefined),
    };
    eventBus = {
      publish: vi.fn(),
    };
    taskMapper = {
      parseTaskStatus: vi.fn().mockReturnValue('pending'),
      resolveTaskStatus: vi.fn().mockReturnValue('pending'),
      mapToDetail: vi.fn().mockReturnValue({
        ...createdTask,
        scope: ParsingScope.SELECTED,
        mode: ParsingTaskMode.RECHECK_GROUP,
        groupIds: [1],
        postLimit: null,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
      }),
    };
    descriptionParser = new TaskDescriptionParser();

    handler = new CreateParsingTaskHandler(
      repository as ITasksRepository,
      groupResolver as TaskGroupResolverService,
      parsingQueue as ParsingQueueService,
      eventBus as EventBus,
      taskMapper as TaskMapper,
      descriptionParser,
    );
  });

  it('создаёт задачу перепроверки с mode и postLimit null', async () => {
    await handler.execute(
      new CreateParsingTaskCommand(
        ParsingScope.SELECTED,
        [1],
        undefined,
        ParsingTaskMode.RECHECK_GROUP,
      ),
    );

    expect(groupResolver.buildTaskTitle).toHaveBeenCalledWith(
      ParsingScope.SELECTED,
      groups,
      ParsingTaskMode.RECHECK_GROUP,
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Перепроверка группы: Test group',
        description: JSON.stringify({
          scope: ParsingScope.SELECTED,
          groupIds: [1],
          mode: ParsingTaskMode.RECHECK_GROUP,
          postLimit: null,
        }),
      }),
    );
    expect(parsingQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: createdTask.id,
        scope: ParsingScope.SELECTED,
        groupIds: [1],
        mode: ParsingTaskMode.RECHECK_GROUP,
        postLimit: null,
      }),
    );
  });

  it('бросает NotFoundException, если для задачи нет групп', async () => {
    vi.mocked(groupResolver.resolveGroups).mockResolvedValue([]);

    await expect(
      handler.execute(
        new CreateParsingTaskCommand(
          ParsingScope.SELECTED,
          [1],
          undefined,
          ParsingTaskMode.RECHECK_GROUP,
        ),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
