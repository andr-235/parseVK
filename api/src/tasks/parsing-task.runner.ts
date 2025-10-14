import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { APIError } from 'vk-io';
import { CommentSource, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { VkService } from '../vk/vk.service';
import type { IPost } from '../vk/interfaces/post.interfaces';
import type { IComment } from '../vk/interfaces/comment.interfaces';
import { ParsingScope } from './dto/create-parsing-task.dto';
import type { ParsingTaskJobData } from './interfaces/parsing-task-job.interface';
import type {
  CommentEntity,
  PrismaGroupRecord,
  PrismaTaskRecord,
  TaskProcessingContext,
} from './interfaces/parsing-task-runner.types';
import type { ParsingStats } from './interfaces/parsing-stats.interface';
import { AuthorActivityService } from '../common/services/author-activity.service';
import { normalizeComment } from '../common/utils/comment-normalizer';
import { TasksGateway } from './tasks.gateway';
import { TaskCancellationService } from './task-cancellation.service';
import { TaskCancelledError } from './errors/task-cancelled.error';

@Injectable()
export class ParsingTaskRunner {
  private readonly logger = new Logger(ParsingTaskRunner.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vkService: VkService,
    private readonly authorActivityService: AuthorActivityService,
    private readonly tasksGateway: TasksGateway,
    private readonly cancellationService: TaskCancellationService,
  ) {}

  async execute(job: ParsingTaskJobData): Promise<void> {
    const { taskId, scope, groupIds, postLimit } = job;

    this.logger.log(
      `Запуск парсинга задачи ${taskId}: scope=${scope}, количество групп=${groupIds.length}, лимит постов=${postLimit}`,
    );

    this.cancellationService.throwIfCancelled(taskId);

    const task = (await this.prisma.task.findUnique({
      where: { id: taskId },
    })) as PrismaTaskRecord | null;
    if (!task) {
      this.logger.warn(
        `Задача ${taskId} не найдена в базе данных, парсинг пропущен`,
      );
      return;
    }

    const groups = await this.safeResolveGroups(scope, groupIds);
    this.logger.log(
      `Для задачи ${taskId} определено ${groups.length} групп для обработки`,
    );

    if (!groups.length) {
      const updatedTask = (await this.prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          description: JSON.stringify({
            scope,
            groupIds,
            postLimit,
            error: 'Нет доступных групп для парсинга',
          }),
        } as Prisma.TaskUncheckedUpdateInput,
      })) as PrismaTaskRecord;
      this.tasksGateway.broadcastStatus({
        id: taskId,
        status: 'failed',
        completed: false,
        totalItems: updatedTask.totalItems ?? groupIds.length,
        processedItems: updatedTask.processedItems ?? 0,
        progress: updatedTask.progress ?? 0,
        scope,
        groupIds,
        postLimit,
        description: updatedTask.description ?? null,
        error: 'Нет доступных групп для парсинга',
      });
      this.tasksGateway.broadcastProgress({
        id: taskId,
        status: 'failed',
        completed: false,
        totalItems: updatedTask.totalItems ?? groupIds.length,
        processedItems: updatedTask.processedItems ?? 0,
        progress: updatedTask.progress ?? 0,
        scope,
        groupIds,
        postLimit,
        description: updatedTask.description ?? null,
        error: 'Нет доступных групп для парсинга',
      });
      const error = new NotFoundException('Нет доступных групп для парсинга');
      this.logger.warn(
        `Задача ${taskId} завершилась ошибкой: ${error.message}`,
      );
      throw error;
    }

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

    try {
      await this.processGroups({
        groups,
        postLimit,
        context,
        taskId,
      });

      const skippedGroupsMessage = this.buildSkippedGroupsMessage(
        context.skippedGroupVkIds,
      );

      const updatedTask = (await this.prisma.task.update({
        where: { id: taskId },
        data: {
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
          }),
        } as Prisma.TaskUncheckedUpdateInput,
      })) as PrismaTaskRecord;

      this.tasksGateway.broadcastProgress({
        id: taskId,
        status: 'done',
        completed: true,
        totalItems: updatedTask.totalItems ?? context.totalGroups,
        processedItems: updatedTask.processedItems ?? context.totalGroups,
        progress: updatedTask.progress ?? 1,
        stats: context.stats,
        scope,
        groupIds,
        postLimit,
        skippedGroupsMessage: skippedGroupsMessage ?? null,
        description: updatedTask.description ?? null,
      });

      this.tasksGateway.broadcastStatus({
        id: taskId,
        status: 'done',
        completed: true,
        totalItems: updatedTask.totalItems ?? context.totalGroups,
        processedItems: updatedTask.processedItems ?? context.totalGroups,
        progress: updatedTask.progress ?? 1,
        stats: context.stats,
        scope,
        groupIds,
        postLimit,
        skippedGroupsMessage: skippedGroupsMessage ?? null,
        description: updatedTask.description ?? null,
      });

      this.logger.log(
        `Задача ${taskId} успешно завершена: группы=${context.stats.groups}, посты=${context.stats.posts}, комментарии=${context.stats.comments}, авторы=${context.stats.authors}`,
      );
    } catch (error) {
      if (error instanceof TaskCancelledError) {
        this.logger.warn(`Задача ${taskId} отменена пользователем`);
        throw error;
      }

      const skippedGroupsMessage = this.buildSkippedGroupsMessage(
        context.skippedGroupVkIds,
      );

      const updatedTask = (await this.prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          description: JSON.stringify({
            scope,
            groupIds,
            postLimit,
            error: error instanceof Error ? error.message : String(error),
            skippedGroupsMessage: skippedGroupsMessage ?? undefined,
            stats: context.stats,
            skippedGroupIds: context.skippedGroupVkIds.length
              ? context.skippedGroupVkIds
              : undefined,
          }),
        } as Prisma.TaskUncheckedUpdateInput,
      })) as PrismaTaskRecord;

      const normalizedError =
        error instanceof Error ? error.message : String(error);

      this.tasksGateway.broadcastProgress({
        id: taskId,
        status: 'failed',
        completed: false,
        totalItems: updatedTask.totalItems ?? context.totalGroups,
        processedItems: updatedTask.processedItems ?? context.processedGroups,
        progress:
          updatedTask.progress ??
          (context.totalGroups > 0
            ? context.processedGroups / context.totalGroups
            : 0),
        stats: context.stats,
        scope,
        groupIds,
        postLimit,
        skippedGroupsMessage: skippedGroupsMessage ?? null,
        description: updatedTask.description ?? null,
        error: normalizedError,
      });

      this.tasksGateway.broadcastStatus({
        id: taskId,
        status: 'failed',
        completed: false,
        totalItems: updatedTask.totalItems ?? context.totalGroups,
        processedItems: updatedTask.processedItems ?? context.processedGroups,
        progress:
          updatedTask.progress ??
          (context.totalGroups > 0
            ? context.processedGroups / context.totalGroups
            : 0),
        stats: context.stats,
        scope,
        groupIds,
        postLimit,
        skippedGroupsMessage: skippedGroupsMessage ?? null,
        description: updatedTask.description ?? null,
        error: normalizedError,
      });

      this.logger.error(
        `Задача ${taskId} завершилась с ошибкой: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    } finally {
      this.cancellationService.clear(taskId);
    }
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
    };
  }

  private async processGroups(params: {
    groups: PrismaGroupRecord[];
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

      const shouldUpdateProgress = await this.processGroup({
        group,
        postLimit,
        context,
        taskId,
      });

      if (shouldUpdateProgress) {
        await this.updateTaskProgress(taskId, context, 1);
      }
    }
  }

  private async processGroup(params: {
    group: PrismaGroupRecord;
    postLimit: number;
    context: TaskProcessingContext;
    taskId: number;
  }): Promise<boolean> {
    const { group, postLimit, context, taskId } = params;
    const ownerId = this.toGroupOwnerId(group.vkId);

    this.cancellationService.throwIfCancelled(taskId);

    if (this.isGroupWallDisabled(group)) {
      this.handleSkippedGroup(context, group);
      this.logger.warn(
        `Стена группы ${group.vkId} отключена, группа будет пропущена`,
      );
      return false;
    }

    let posts: IPost[];

    try {
      posts = await this.vkService.getGroupRecentPosts({
        ownerId,
        count: postLimit,
      });
    } catch (error) {
      if (this.isWallDisabledApiError(error)) {
        this.handleSkippedGroup(context, group);
        await this.markGroupWallDisabled(group);
        this.logger.warn(
          `Группа ${group.vkId} имеет отключенную стену (по данным API), группа будет пропущена`,
        );
        return false;
      }

      throw error;
    }

    this.logger.log(
      `Задача ${taskId}: получено ${posts.length} постов для группы ${group.vkId}`,
    );

    for (const post of posts) {
      this.cancellationService.throwIfCancelled(taskId);

      await this.savePost(post, group);
      context.stats.posts += 1;

      const { comments, authorIds } = await this.fetchAllComments(
        ownerId,
        post.id,
        taskId,
      );
      const newAuthorIds = this.extractNewAuthorIds(
        authorIds,
        context.processedAuthorIds,
      );

      if (newAuthorIds.length) {
        this.cancellationService.throwIfCancelled(taskId);

        const createdOrUpdated =
          await this.authorActivityService.saveAuthors(newAuthorIds);
        context.stats.authors += createdOrUpdated;
        newAuthorIds.forEach((id) => context.processedAuthorIds.add(id));
        this.logger.debug(
          `Задача ${taskId}: обновлено ${createdOrUpdated} авторов после поста ${post.id} группы ${group.vkId}`,
        );
      }

      if (comments.length) {
        this.cancellationService.throwIfCancelled(taskId);

        const savedCount = await this.authorActivityService.saveComments(
          comments,
          {
            source: CommentSource.TASK,
          },
        );
        context.stats.comments += savedCount;
        this.logger.debug(
          `Задача ${taskId}: сохранено ${savedCount} комментариев для поста ${post.id} группы ${group.vkId}`,
        );
      }
    }

    return true;
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
      .map((token) => this.parseGroupId(token))
      .filter((value): value is number => value != null);
  }

  private toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private parseGroupId(value: unknown): number | null {
    const numeric = this.toFiniteNumber(value);
    if (numeric == null) {
      return null;
    }

    const truncated = Math.trunc(numeric);
    return Number.isFinite(truncated) ? truncated : null;
  }

  private extractNewAuthorIds(
    authorIds: number[],
    processedAuthorIds: Set<number>,
  ): number[] {
    return authorIds.filter((id) => id > 0 && !processedAuthorIds.has(id));
  }

  private handleSkippedGroup(
    context: TaskProcessingContext,
    group: PrismaGroupRecord,
  ): void {
    if (!context.skippedGroupVkIds.includes(group.vkId)) {
      context.skippedGroupVkIds.push(group.vkId);
      context.stats.groups = Math.max(0, context.stats.groups - 1);
    }
  }

  private async updateTaskProgress(
    taskId: number,
    context: TaskProcessingContext,
    handledCount: number,
  ): Promise<void> {
    context.processedGroups = Math.min(
      context.processedGroups + handledCount,
      context.totalGroups,
    );
    const progress =
      context.totalGroups > 0
        ? Math.min(1, context.processedGroups / context.totalGroups)
        : 0;

    this.cancellationService.throwIfCancelled(taskId);

    let updatedTask: PrismaTaskRecord;

    try {
      updatedTask = (await this.prisma.task.update({
        where: { id: taskId },
        data: {
          processedItems: context.processedGroups,
          progress,
          status: 'running',
        } as Prisma.TaskUncheckedUpdateInput,
      })) as PrismaTaskRecord;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025' &&
        this.cancellationService.isCancelled(taskId)
      ) {
        throw new TaskCancelledError(taskId);
      }

      throw error;
    }

    this.tasksGateway.broadcastProgress({
      id: taskId,
      status: 'running',
      completed: false,
      totalItems: updatedTask.totalItems ?? context.totalGroups,
      processedItems: updatedTask.processedItems ?? context.processedGroups,
      progress: updatedTask.progress ?? progress,
      stats: context.stats,
    });

    this.logger.debug(
      `Задача ${taskId}: обновление прогресса ${context.processedGroups}/${context.totalGroups} (${Math.round(progress * 100)}%)`,
    );
  }

  async resolveGroups(
    scope: ParsingScope,
    groupIds: number[],
  ): Promise<PrismaGroupRecord[]> {
    return this.doResolveGroups(scope, groupIds);
  }

  buildTaskTitle(scope: ParsingScope, groups: PrismaGroupRecord[]): string {
    if (scope === ParsingScope.ALL) {
      return `Парсинг всех групп (${groups.length})`;
    }

    if (groups.length === 1) {
      return `Парсинг группы: ${groups[0].name}`;
    }

    return `Парсинг выбранных групп (${groups.length})`;
  }

  private async safeResolveGroups(
    scope: ParsingScope,
    groupIds: number[],
  ): Promise<PrismaGroupRecord[]> {
    try {
      return await this.doResolveGroups(scope, groupIds);
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

  private async doResolveGroups(
    scope: ParsingScope,
    groupIds: number[],
  ): Promise<PrismaGroupRecord[]> {
    if (scope === ParsingScope.ALL) {
      const groups = await this.prisma.group.findMany({
        orderBy: { updatedAt: 'desc' },
      });

      return groups as PrismaGroupRecord[];
    }

    if (!groupIds?.length) {
      throw new BadRequestException(
        'Необходимо указать идентификаторы групп для парсинга',
      );
    }

    const groups = (await this.prisma.group.findMany({
      where: { id: { in: groupIds } },
    })) as PrismaGroupRecord[];

    if (groups.length !== groupIds.length) {
      const foundIds = new Set(groups.map((group) => group.id));
      const missing = groupIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(`Группы не найдены: ${missing.join(', ')}`);
    }

    return groups;
  }

  private toGroupOwnerId(vkGroupId: number): number {
    return -Math.abs(vkGroupId);
  }

  private buildSkippedGroupsMessage(groupVkIds: number[]): string | null {
    if (!groupVkIds.length) {
      return null;
    }

    const formattedIds = groupVkIds.map(String).join(', ');
    return `Пропущены группы с отключенной стеной: ${formattedIds}`;
  }

  private isGroupWallDisabled(group: PrismaGroupRecord): boolean {
    return typeof group.wall === 'number' && group.wall === 0;
  }

  private isWallDisabledApiError(error: unknown): boolean {
    return error instanceof APIError && error.code === 15;
  }

  private async markGroupWallDisabled(group: PrismaGroupRecord): Promise<void> {
    if (group.wall === 0) {
      return;
    }

    try {
      await this.prisma.group.update({
        where: { id: group.id },
        data: { wall: 0 },
      });
    } catch (_error) {
      // Игнорируем ошибки сохранения, чтобы задача могла продолжить работу.
    }
  }

  private async savePost(post: IPost, group: PrismaGroupRecord): Promise<void> {
    const postedAt = new Date(post.date * 1000);
    const upsertData = {
      groupId: group.id,
      fromId: post.from_id,
      postedAt,
      text: post.text,
      commentsCount: post.comments.count,
      commentsCanPost: post.comments.can_post,
      commentsGroupsCanPost: post.comments.groups_can_post,
      commentsCanClose: post.comments.can_close,
      commentsCanOpen: post.comments.can_open,
    };

    await this.prisma.post.upsert({
      where: {
        ownerId_vkPostId: {
          ownerId: post.owner_id,
          vkPostId: post.id,
        },
      },
      update: upsertData,
      create: {
        ownerId: post.owner_id,
        vkPostId: post.id,
        ...upsertData,
      },
    });
  }

  private async fetchAllComments(
    ownerId: number,
    postId: number,
    taskId: number,
  ): Promise<{ comments: CommentEntity[]; authorIds: number[] }> {
    const batchSize = 100;
    let offset = 0;
    const collected: CommentEntity[] = [];
    const authorIds = new Set<number>();

    while (true) {
      this.cancellationService.throwIfCancelled(taskId);

      const response = await this.vkService.getComments({
        ownerId,
        postId,
        count: batchSize,
        offset,
        needLikes: true,
        extended: true,
        threadItemsCount: 10,
      });

      const items = response.items ?? [];

      if (!items.length) {
        break;
      }

      collected.push(...items.map((item) => normalizeComment(item)));

      const collectedIds = this.collectAuthorIds(items);
      collectedIds.forEach((id) => authorIds.add(id));

      if (response.profiles?.length) {
        response.profiles.forEach((profile) => authorIds.add(profile.id));
      }

      offset += items.length;

      if (offset >= (response.count ?? 0)) {
        break;
      }
    }

    return {
      comments: collected,
      authorIds: Array.from(authorIds),
    };
  }

  private collectAuthorIds(comments: IComment[]): number[] {
    const ids: number[] = [];

    for (const comment of comments) {
      if (typeof comment.fromId === 'number') {
        ids.push(comment.fromId);
      }

      if (comment.threadItems?.length) {
        ids.push(...this.collectAuthorIds(comment.threadItems));
      }
    }

    return ids;
  }
}
