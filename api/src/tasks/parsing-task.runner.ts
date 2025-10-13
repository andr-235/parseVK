import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { APIError } from 'vk-io';
import { Prisma } from '@prisma/client';
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

@Injectable()
export class ParsingTaskRunner {
  private readonly logger = new Logger(ParsingTaskRunner.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vkService: VkService,
  ) {}

  async execute(job: ParsingTaskJobData): Promise<void> {
    const { taskId, scope, groupIds, postLimit } = job;

    this.logger.log(
      `Запуск парсинга задачи ${taskId}: scope=${scope}, количество групп=${groupIds.length}, лимит постов=${postLimit}`,
    );

    const task = await this.prisma.task.findUnique({ where: { id: taskId } }) as PrismaTaskRecord | null;
    if (!task) {
      this.logger.warn(`Задача ${taskId} не найдена в базе данных, парсинг пропущен`);
      return;
    }

    const groups = await this.safeResolveGroups(scope, groupIds);
    this.logger.log(`Для задачи ${taskId} определено ${groups.length} групп для обработки`);

    if (!groups.length) {
      await this.prisma.task.update({
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
      });
      const error = new NotFoundException('Нет доступных групп для парсинга');
      this.logger.warn(`Задача ${taskId} завершилась ошибкой: ${error.message}`);
      throw error;
    }

    const context = this.createProcessingContext(groups.length, task.processedItems ?? 0);

    try {
      await this.processGroups({
        groups,
        postLimit,
        context,
        taskId,
      });

      const skippedGroupsMessage = this.buildSkippedGroupsMessage(context.skippedGroupVkIds);

      await this.prisma.task.update({
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
          }),
        } as Prisma.TaskUncheckedUpdateInput,
      });

      this.logger.log(
        `Задача ${taskId} успешно завершена: группы=${context.stats.groups}, посты=${context.stats.posts}, комментарии=${context.stats.comments}, авторы=${context.stats.authors}`,
      );
    } catch (error) {
      const skippedGroupsMessage = this.buildSkippedGroupsMessage(context.skippedGroupVkIds);

      await this.prisma.task.update({
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
          }),
        } as Prisma.TaskUncheckedUpdateInput,
      });

      this.logger.error(
        `Задача ${taskId} завершилась с ошибкой: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  private createProcessingContext(totalGroups: number, processedGroups: number): TaskProcessingContext {
    const clampedProcessed = Math.min(Math.max(processedGroups, 0), totalGroups);

    return {
      totalGroups,
      processedGroups: clampedProcessed,
      stats: {
        groups: totalGroups,
        posts: 0,
        comments: 0,
        authors: 0,
      },
      skippedGroupVkIds: [],
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

    for (const group of groups) {
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

    if (this.isGroupWallDisabled(group)) {
      this.handleSkippedGroup(context, group);
      this.logger.warn(`Стена группы ${group.vkId} отключена, группа будет пропущена`);
      return false;
    }

    let posts: IPost[];

    try {
      posts = await this.vkService.getGroupRecentPosts({ ownerId, count: postLimit });
    } catch (error) {
      if (this.isWallDisabledApiError(error)) {
        this.handleSkippedGroup(context, group);
        await this.markGroupWallDisabled(group);
        this.logger.warn(`Группа ${group.vkId} имеет отключенную стену (по данным API), группа будет пропущена`);
        return false;
      }

      throw error;
    }

    this.logger.log(`Задача ${taskId}: получено ${posts.length} постов для группы ${group.vkId}`);

    for (const post of posts) {
      await this.savePost(post, group);
      context.stats.posts += 1;

      const { comments, authorIds } = await this.fetchAllComments(ownerId, post.id);
      const newAuthorIds = this.extractNewAuthorIds(authorIds, context.processedAuthorIds);

      if (newAuthorIds.length) {
        const createdOrUpdated = await this.saveAuthors(newAuthorIds);
        context.stats.authors += createdOrUpdated;
        newAuthorIds.forEach((id) => context.processedAuthorIds.add(id));
        this.logger.debug(
          `Задача ${taskId}: обновлено ${createdOrUpdated} авторов после поста ${post.id} группы ${group.vkId}`,
        );
      }

      if (comments.length) {
        const savedCount = await this.saveComments(comments);
        context.stats.comments += savedCount;
        this.logger.debug(
          `Задача ${taskId}: сохранено ${savedCount} комментариев для поста ${post.id} группы ${group.vkId}`,
        );
      }
    }

    return true;
  }

  private extractNewAuthorIds(authorIds: number[], processedAuthorIds: Set<number>): number[] {
    return authorIds.filter((id) => id > 0 && !processedAuthorIds.has(id));
  }

  private handleSkippedGroup(context: TaskProcessingContext, group: PrismaGroupRecord): void {
    if (!context.skippedGroupVkIds.includes(group.vkId)) {
      context.skippedGroupVkIds.push(group.vkId);
      context.stats.groups = Math.max(0, context.stats.groups - 1);
    }
  }

  private async updateTaskProgress(taskId: number, context: TaskProcessingContext, handledCount: number): Promise<void> {
    context.processedGroups = Math.min(context.processedGroups + handledCount, context.totalGroups);
    const progress = context.totalGroups > 0
      ? Math.min(1, context.processedGroups / context.totalGroups)
      : 0;

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        processedItems: context.processedGroups,
        progress,
        status: 'running',
      } as Prisma.TaskUncheckedUpdateInput,
    });

    this.logger.debug(
      `Задача ${taskId}: обновление прогресса ${context.processedGroups}/${context.totalGroups} (${Math.round(progress * 100)}%)`,
    );
  }

  async resolveGroups(scope: ParsingScope, groupIds: number[]): Promise<PrismaGroupRecord[]> {
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

  private async safeResolveGroups(scope: ParsingScope, groupIds: number[]): Promise<PrismaGroupRecord[]> {
    try {
      return await this.doResolveGroups(scope, groupIds);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        return [];
      }

      throw error;
    }
  }

  private async doResolveGroups(scope: ParsingScope, groupIds: number[]): Promise<PrismaGroupRecord[]> {
    if (scope === ParsingScope.ALL) {
      const groups = await this.prisma.group.findMany({
        orderBy: { updatedAt: 'desc' },
      });

      return groups as PrismaGroupRecord[];
    }

    if (!groupIds?.length) {
      throw new BadRequestException('Необходимо указать идентификаторы групп для парсинга');
    }

    const groups = await this.prisma.group.findMany({
      where: { id: { in: groupIds } },
    }) as PrismaGroupRecord[];

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

  private async fetchAllComments(ownerId: number, postId: number): Promise<{ comments: CommentEntity[]; authorIds: number[]; }> {
    const batchSize = 100;
    let offset = 0;
    const collected: CommentEntity[] = [];
    const authorIds = new Set<number>();

    while (true) {
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

      collected.push(...items.map((item) => this.normalizeComment(item)));

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

  private normalizeComment(comment: IComment): CommentEntity {
    return {
      postId: comment.postId,
      ownerId: comment.ownerId,
      vkCommentId: comment.vkCommentId,
      fromId: comment.fromId,
      text: comment.text,
      publishedAt: comment.publishedAt,
      likesCount: comment.likesCount ?? null,
      parentsStack: comment.parentsStack ?? null,
      threadCount: comment.threadCount ?? null,
      threadItems: comment.threadItems?.length
        ? comment.threadItems.map((item) => this.normalizeComment(item))
        : null,
      attachments: comment.attachments ?? null,
      replyToUser: comment.replyToUser ?? null,
      replyToComment: comment.replyToComment ?? null,
      isDeleted: comment.isDeleted,
    };
  }

  private async saveComments(comments: CommentEntity[]): Promise<number> {
    let saved = 0;

    for (const comment of comments) {
      const threadItemsJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
        comment.threadItems?.length
          ? (comment.threadItems.map((item) => this.serializeComment(item)) as Prisma.InputJsonValue)
          : Prisma.JsonNull;

      const attachmentsJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined =
        comment.attachments === null
          ? Prisma.JsonNull
          : comment.attachments === undefined
            ? undefined
            : (comment.attachments as Prisma.InputJsonValue);

      const parentsStackJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
        comment.parentsStack === null
          ? Prisma.JsonNull
          : (comment.parentsStack as Prisma.InputJsonValue);

      const authorVkId = comment.fromId > 0 ? comment.fromId : null;
      const upsertData = {
        postId: comment.postId,
        ownerId: comment.ownerId,
        vkCommentId: comment.vkCommentId,
        fromId: comment.fromId,
        authorVkId,
        text: comment.text,
        publishedAt: comment.publishedAt,
        likesCount: comment.likesCount,
        parentsStack: parentsStackJson,
        threadCount: comment.threadCount,
        threadItems: threadItemsJson,
        attachments: attachmentsJson,
        replyToUser: comment.replyToUser,
        replyToComment: comment.replyToComment,
        isDeleted: comment.isDeleted,
      };

      await this.prisma.comment.upsert({
        where: {
          ownerId_vkCommentId: {
            ownerId: comment.ownerId,
            vkCommentId: comment.vkCommentId,
          },
        },
        update: upsertData,
        create: upsertData,
      });

      saved += 1;

      const threadItems = comment.threadItems;
      if (threadItems?.length) {
        saved += await this.saveComments(threadItems);
      }
    }

    return saved;
  }

  private serializeComment(comment: CommentEntity): Record<string, unknown> {
    return {
      vkCommentId: comment.vkCommentId,
      ownerId: comment.ownerId,
      postId: comment.postId,
      fromId: comment.fromId,
      text: comment.text,
      publishedAt: comment.publishedAt.toISOString(),
      likesCount: comment.likesCount ?? null,
      parentsStack: comment.parentsStack ?? null,
      threadCount: comment.threadCount ?? null,
      threadItems: comment.threadItems?.length
        ? comment.threadItems.map((item) => this.serializeComment(item))
        : null,
      attachments: comment.attachments ?? null,
      replyToUser: comment.replyToUser ?? null,
      replyToComment: comment.replyToComment ?? null,
      isDeleted: comment.isDeleted,
    };
  }

  private async saveAuthors(userIds: number[]): Promise<number> {
    const authors = await this.vkService.getAuthors(userIds);

    for (const author of authors) {
      const upsertData = {
        firstName: author.first_name,
        lastName: author.last_name,
        domain: author.domain,
        screenName: author.screen_name,
        isClosed: author.is_closed,
        canAccessClosed: author.can_access_closed,
        photo50: author.photo_50,
        photo100: author.photo_100,
        photo200Orig: author.photo_200_orig,
        city: author.city,
        country: author.country,
      };

      await this.prisma.author.upsert({
        where: { vkUserId: author.id },
        update: upsertData,
        create: {
          vkUserId: author.id,
          ...upsertData,
        },
      });
    }

    return authors.length;
  }
}
