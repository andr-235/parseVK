import {
  CommandHandler,
  ICommandHandler,
  EventBus,
  CommandBus,
} from '@nestjs/cqrs';
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  BadRequestException,
} from '@nestjs/common';
import { ExecuteParsingTaskCommand } from '../impl/execute-parsing-task.command.js';
import { ProcessGroupCommand } from '../impl/process-group.command.js';
import { UpdateTaskProgressCommand } from '../impl/update-task-progress.command.js';
import type {
  IParsingTaskRepository,
  ParsingGroupRecord,
} from '@/tasks/interfaces/parsing-task-repository.interface.js';
import type { ParsingStats } from '@/tasks/interfaces/parsing-stats.interface.js';
import type { TaskProcessingContext } from '@/tasks/interfaces/parsing-task-runner.types.js';
import { TaskCancellationService } from '@/tasks/task-cancellation.service.js';
import { TaskCancelledError } from '@/tasks/errors/task-cancelled.error.js';
import { ParsingTaskRunner } from '@/tasks/parsing-task.runner.js';
import { MetricsService } from '@/metrics/metrics.service.js';
import {
  TaskStartedEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
} from '@/tasks/events/index.js';
import type { ParsingScope } from '@/tasks/dto/create-parsing-task.dto.js';

@Injectable()
@CommandHandler(ExecuteParsingTaskCommand)
export class ExecuteParsingTaskHandler implements ICommandHandler<
  ExecuteParsingTaskCommand,
  void
> {
  private readonly logger = new Logger(ExecuteParsingTaskHandler.name);

  constructor(
    @Inject('IParsingTaskRepository')
    private readonly repository: IParsingTaskRepository,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly cancellationService: TaskCancellationService,
    private readonly runner: ParsingTaskRunner, // Temporary, for helper methods
    @Optional() private readonly metricsService?: MetricsService,
  ) {}

  async execute(command: ExecuteParsingTaskCommand): Promise<void> {
    const { taskId, scope, groupIds, postLimit } = command;

    this.logger.log(
      `Запуск парсинга задачи ${taskId}: scope=${scope}, количество групп=${groupIds.length}, лимит постов=${postLimit}`,
    );

    this.cancellationService.throwIfCancelled(taskId);

    // Get task
    const task = await this.repository.findTaskById(taskId);
    if (!task) {
      this.logger.warn(
        `Задача ${taskId} не найдена в базе данных, парсинг пропущен`,
      );
      return;
    }

    // Resolve groups
    const groups = await this.safeResolveGroups(scope, groupIds);
    this.logger.log(
      `Для задачи ${taskId} определено ${groups.length} групп для обработки`,
    );

    if (!groups.length) {
      await this.failTask(
        taskId,
        'Нет доступных групп для парсинга',
        undefined,
        scope,
        groupIds,
        postLimit,
      );
      return;
    }

    // Build context
    const storedMetadata = this.extractStoredMetadata(task.description ?? null);
    const context = this.createProcessingContext(
      groups.length,
      task.processedItems ?? 0,
      storedMetadata.stats,
      storedMetadata.skippedGroupIds,
    );

    if (context.processedGroups > 0) {
      this.logger.log(
        `Задача ${taskId}: возобновление обработки, уже обработано групп: ${context.processedGroups}/${context.totalGroups}`,
      );
    }

    // Publish TaskStartedEvent
    this.eventBus.publish(new TaskStartedEvent(taskId, new Date()));

    try {
      // Process all groups
      await this.processGroups({
        groups,
        postLimit,
        context,
        taskId,
      });

      // Complete task
      await this.completeTask(taskId, context, scope, groupIds, postLimit);
    } catch (error) {
      if (error instanceof TaskCancelledError) {
        this.logger.warn(`Задача ${taskId} отменена пользователем`);
        throw error;
      }

      await this.failTask(taskId, error, context, scope, groupIds, postLimit);
      throw error;
    } finally {
      this.cancellationService.clear(taskId);
    }
  }

  // Process all groups
  private async processGroups(params: {
    groups: ParsingGroupRecord[];
    postLimit: number;
    context: TaskProcessingContext;
    taskId: number;
  }): Promise<void> {
    const { groups, postLimit, context, taskId } = params;

    this.cancellationService.throwIfCancelled(taskId);

    const alreadyProcessed = Math.min(
      Math.max(context.processedGroups, 0),
      groups.length,
    );
    const remainingGroups =
      alreadyProcessed > 0 ? groups.slice(alreadyProcessed) : groups;

    if (alreadyProcessed > 0) {
      this.logger.log(
        `Задача ${taskId}: пропускаем ${alreadyProcessed} обработанных ранее групп, продолжим с индекса ${alreadyProcessed + 1}`,
      );
    }

    if (!remainingGroups.length) {
      this.logger.log(
        `Задача ${taskId}: все группы уже были обработаны, дополнительная обработка не требуется`,
      );
      return;
    }

    for (const group of remainingGroups) {
      this.cancellationService.throwIfCancelled(taskId);

      // Delegate to ProcessGroupCommand
      const shouldUpdateProgress = await this.commandBus.execute<boolean>(
        new ProcessGroupCommand(group, postLimit, context, taskId),
      );

      if (shouldUpdateProgress) {
        // Update progress via command
        context.processedGroups += 1;
        const progress =
          context.totalGroups > 0
            ? Math.min(1, context.processedGroups / context.totalGroups)
            : 0;

        await this.commandBus.execute(
          new UpdateTaskProgressCommand(
            taskId,
            context.processedGroups,
            progress,
            'running',
            context.stats,
          ),
        );
      }
    }
  }

  // Complete task successfully
  private async completeTask(
    taskId: number,
    context: TaskProcessingContext,
    scope: ParsingScope,
    groupIds: number[],
    postLimit: number,
  ): Promise<void> {
    const skippedGroupsMessage = this.buildSkippedGroupsMessage(
      context.skippedGroupVkIds,
    );

    const updatedTask = await this.repository.updateTask(taskId, {
      completed: true,
      processedItems: context.totalGroups,
      progress: 1,
      status: 'done',
      description: JSON.stringify({
        scope,
        groupIds,
        postLimit,
        stats: context.stats,
        skippedGroupsMessage: skippedGroupsMessage ?? undefined,
        skippedGroupIds: context.skippedGroupVkIds.length
          ? context.skippedGroupVkIds
          : undefined,
        failedGroups:
          context.failedGroups.length > 0 ? context.failedGroups : undefined,
      }),
    });

    if (!updatedTask) {
      throw new NotFoundException(`Задача ${taskId} не найдена`);
    }

    this.metricsService?.recordTask('done');

    // Publish TaskCompletedEvent
    this.eventBus.publish(
      new TaskCompletedEvent(
        taskId,
        new Date(),
        context.stats,
        context.skippedGroupVkIds,
      ),
    );

    const failedGroupsInfo =
      context.failedGroups.length > 0
        ? `, ошибок в группах: ${context.failedGroups.length}`
        : '';
    this.logger.log(
      `Задача ${taskId} успешно завершена: группы=${context.stats.groups}, посты=${context.stats.posts}, комментарии=${context.stats.comments}, авторы=${context.stats.authors}${failedGroupsInfo}`,
    );

    if (context.failedGroups.length > 0) {
      context.failedGroups.forEach((failedGroup) => {
        this.logger.warn(
          `Задача ${taskId}: ошибка в группе ${failedGroup.vkId} (${failedGroup.name}): ${failedGroup.error}`,
        );
      });
    }
  }

  // Fail task with error
  private async failTask(
    taskId: number,
    error: unknown,
    context?: TaskProcessingContext,
    scope?: ParsingScope,
    groupIds?: number[],
    postLimit?: number,
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const skippedGroupsMessage = context
      ? this.buildSkippedGroupsMessage(context.skippedGroupVkIds)
      : null;

    const updatedTask = await this.repository.updateTask(taskId, {
      status: 'failed',
      description: JSON.stringify({
        scope,
        groupIds,
        postLimit,
        error: errorMessage,
        skippedGroupsMessage: skippedGroupsMessage ?? undefined,
        stats: context?.stats,
        skippedGroupIds:
          context && context.skippedGroupVkIds.length
            ? context.skippedGroupVkIds
            : undefined,
        failedGroups:
          context && context.failedGroups.length > 0
            ? context.failedGroups
            : undefined,
      }),
    });

    if (!updatedTask) {
      throw new NotFoundException(`Задача ${taskId} не найдена`);
    }

    // Publish TaskFailedEvent
    this.eventBus.publish(
      new TaskFailedEvent(taskId, new Date(), errorMessage, context?.stats),
    );

    this.logger.error(
      `Задача ${taskId} завершилась с ошибкой: ${errorMessage}`,
    );
  }

  // Helper methods (copied from ParsingTaskRunner)
  private async safeResolveGroups(
    scope: ParsingScope,
    groupIds: number[],
  ): Promise<ParsingGroupRecord[]> {
    try {
      return await this.runner.resolveGroups(scope, groupIds);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        return [];
      }
      throw error;
    }
  }

  private extractStoredMetadata(description: string | null): {
    stats: ParsingStats | null;
    skippedGroupIds: number[];
  } {
    if (!description) {
      return { stats: null, skippedGroupIds: [] };
    }

    try {
      const parsed = JSON.parse(description) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') {
        return { stats: null, skippedGroupIds: [] };
      }

      const stats = this.normalizeParsingStats(parsed['stats']);
      const skippedGroupIds = this.normalizeSkippedGroupIds(parsed);

      return {
        stats,
        skippedGroupIds,
      };
    } catch {
      return { stats: null, skippedGroupIds: [] };
    }
  }

  private normalizeParsingStats(value: unknown): ParsingStats | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const groups = this.toFiniteNumber(record['groups']);
    const posts = this.toFiniteNumber(record['posts']);
    const comments = this.toFiniteNumber(record['comments']);
    const authors = this.toFiniteNumber(record['authors']);

    if (
      groups == null &&
      posts == null &&
      comments == null &&
      authors == null
    ) {
      return null;
    }

    return {
      groups: groups ?? 0,
      posts: posts ?? 0,
      comments: comments ?? 0,
      authors: authors ?? 0,
    };
  }

  private normalizeSkippedGroupIds(data: Record<string, unknown>): number[] {
    const skippedRaw = data['skippedGroupIds'];
    const idsFromArray = Array.isArray(skippedRaw)
      ? skippedRaw
          .map((value) => this.parseGroupId(value))
          .filter((value): value is number => value != null)
      : [];

    const message = data['skippedGroupsMessage'];
    const idsFromMessage: number[] =
      typeof message === 'string'
        ? this.extractGroupIdsFromMessage(message)
        : [];

    return Array.from(new Set([...idsFromArray, ...idsFromMessage]));
  }

  private extractGroupIdsFromMessage(message: string): number[] {
    const matches = message.match(/\d+/g);
    if (!matches) {
      return [];
    }
    return matches
      .map((token) => Number.parseInt(token, 10))
      .filter((item) => Number.isFinite(item));
  }

  private parseGroupId(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private createProcessingContext(
    totalGroups: number,
    processedGroups: number,
    previousStats: ParsingStats | null,
    skippedGroupIds: number[],
  ): TaskProcessingContext {
    const clampedProcessed = Math.min(
      Math.max(processedGroups, 0),
      totalGroups,
    );
    const normalizedSkipped = Array.from(
      new Set(skippedGroupIds.filter((value) => Number.isFinite(value))),
    );

    const baseGroups =
      previousStats?.groups ??
      Math.max(totalGroups - normalizedSkipped.length, 0);
    const stats: ParsingStats = {
      groups: Math.max(Math.min(baseGroups, totalGroups), 0),
      posts: previousStats?.posts ?? 0,
      comments: previousStats?.comments ?? 0,
      authors: previousStats?.authors ?? 0,
    };

    return {
      totalGroups,
      processedGroups: clampedProcessed,
      stats,
      skippedGroupVkIds: normalizedSkipped,
      processedAuthorIds: new Set<number>(),
      failedGroups: [],
    };
  }

  private buildSkippedGroupsMessage(groupVkIds: number[]): string | null {
    if (!groupVkIds.length) {
      return null;
    }

    const formattedIds = groupVkIds.map(String).join(', ');
    return `Пропущены группы с отключенной стеной: ${formattedIds}`;
  }
}
