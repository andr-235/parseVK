import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandBus } from '@nestjs/cqrs';
import { ProcessGroupHandler } from './process-group.handler.js';
import { ProcessGroupCommand } from '../impl/process-group.command.js';
import { ParsingTaskMode } from '@/tasks/dto/create-parsing-task.dto.js';
import type { ParsingGroupRecord } from '@/tasks/interfaces/parsing-task-repository.interface.js';
import type { TaskProcessingContext } from '@/tasks/interfaces/parsing-task-runner.types.js';
import type { IParsingTaskRepository } from '@/tasks/interfaces/parsing-task-repository.interface.js';
import type { VkService } from '@/vk/vk.service.js';
import { TaskCancellationService } from '@/tasks/task-cancellation.service.js';

const createContext = (): TaskProcessingContext => ({
  totalGroups: 1,
  processedGroups: 0,
  stats: {
    groups: 1,
    posts: 0,
    comments: 0,
    authors: 0,
  },
  skippedGroupVkIds: [],
  processedAuthorIds: new Set<number>(),
  failedGroups: [],
});

async function* makeBatches<T>(
  batches: T[][],
): AsyncGenerator<T[], void, void> {
  for (const batch of batches) {
    await Promise.resolve();
    yield batch;
  }
}

describe('ProcessGroupHandler', () => {
  let vkService: Pick<
    VkService,
    'getGroupRecentPosts' | 'iterateGroupPosts' | 'getComments'
  >;
  let commandBus: Pick<CommandBus, 'execute'>;
  let repository: Pick<IParsingTaskRepository, 'updateGroupWall'>;
  let cancellationService: Pick<TaskCancellationService, 'throwIfCancelled'>;
  let handler: ProcessGroupHandler;

  const group: ParsingGroupRecord = {
    id: 1,
    vkId: 123,
    name: 'Test group',
    wall: 1,
  };

  const postOne = {
    id: 101,
    owner_id: -123,
    from_id: 10,
    date: 1700000000,
    text: 'one',
    comments: {
      count: 0,
      can_post: 1,
      groups_can_post: false,
      can_close: false,
      can_open: true,
    },
  };

  const postTwo = {
    id: 102,
    owner_id: -123,
    from_id: 11,
    date: 1700000100,
    text: 'two',
    comments: {
      count: 0,
      can_post: 1,
      groups_can_post: false,
      can_close: false,
      can_open: true,
    },
  };

  beforeEach(() => {
    vkService = {
      getGroupRecentPosts: vi.fn().mockResolvedValue([postOne]),
      iterateGroupPosts: vi
        .fn()
        .mockReturnValue(makeBatches([[postOne], [postTwo]])),
      getComments: vi.fn().mockResolvedValue({
        items: [],
        profiles: [],
        groups: [],
      }),
    };
    commandBus = {
      execute: vi.fn().mockResolvedValue(undefined),
    };
    repository = {
      updateGroupWall: vi.fn().mockResolvedValue(undefined),
    };
    cancellationService = {
      throwIfCancelled: vi.fn(),
    };

    handler = new ProcessGroupHandler(
      vkService as VkService,
      commandBus as CommandBus,
      repository as IParsingTaskRepository,
      cancellationService as TaskCancellationService,
    );
  });

  it('использует получение последних постов для recent_posts', async () => {
    const result = await handler.execute(
      new ProcessGroupCommand(
        group,
        ParsingTaskMode.RECENT_POSTS,
        10,
        createContext(),
        1,
      ),
    );

    expect(result).toBe(true);
    expect(vkService.getGroupRecentPosts).toHaveBeenCalledWith({
      ownerId: -123,
      count: 10,
    });
    expect(vkService.iterateGroupPosts).not.toHaveBeenCalled();
  });

  it('использует полный обход постов для recheck_group', async () => {
    const context = createContext();

    const result = await handler.execute(
      new ProcessGroupCommand(
        group,
        ParsingTaskMode.RECHECK_GROUP,
        null,
        context,
        1,
      ),
    );

    expect(result).toBe(true);
    expect(vkService.iterateGroupPosts).toHaveBeenCalledWith({
      ownerId: -123,
    });
    expect(vkService.getGroupRecentPosts).not.toHaveBeenCalled();
    expect(context.stats.posts).toBe(2);
  });
});
