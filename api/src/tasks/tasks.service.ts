import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { APIError } from 'vk-io';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { VkService } from '../vk/vk.service';
import type { IPost } from '../vk/interfaces/post.interfaces';
import type { IComment } from '../vk/interfaces/comment.interfaces';
import { CreateParsingTaskDto, ParsingScope } from './dto/create-parsing-task.dto';
import type { ParsingStats, ParsingTaskResult } from './interfaces/parsing-task-result.interface';
import type { TaskDetail, TaskSummary, TaskStatus } from './interfaces/task.interface';

type ParsedTaskDescription = {
  scope: ParsingScope | null;
  groupIds: number[];
  postLimit: number | null;
  stats: ParsingStats | null;
  error: string | null;
  skippedGroupsMessage: string | null;
};

type PrismaTaskRecord = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean | null;
  totalItems?: number | null;
  processedItems?: number | null;
  progress?: number | null;
  status?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaGroupRecord = {
  id: number;
  vkId: number;
  name: string;
  wall: number | null;
};

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vkService: VkService,
  ) {}

  async createParsingTask(dto: CreateParsingTaskDto): Promise<ParsingTaskResult> {
    const scope = dto.scope ?? (dto.groupIds?.length ? ParsingScope.SELECTED : ParsingScope.ALL);
    const postLimit = dto.postLimit ?? 10;
    const groupIds = dto.groupIds ?? [];

    const groups = await this.resolveGroups(scope, groupIds);
    if (!groups.length) {
      throw new NotFoundException('Нет доступных групп для парсинга');
    }

    const totalItems = groups.length;

    const task = await this.prisma.task.create({
      data: {
        title: this.buildTaskTitle(scope, groups),
        description: JSON.stringify({ scope, groupIds, postLimit }),
        totalItems,
        processedItems: 0,
        progress: 0,
        status: 'pending',
      } as Prisma.TaskUncheckedCreateInput,
    }) as PrismaTaskRecord;

    const stats: ParsingStats = {
      groups: groups.length,
      posts: 0,
      comments: 0,
      authors: 0,
    };

    const skippedGroupVkIds: number[] = [];

    const processedAuthorIds = new Set<number>();
    let processedItems = 0;

    const updateTaskProgress = async (handledCount: number): Promise<void> => {
      processedItems = Math.min(processedItems + handledCount, totalItems);
      const progress = totalItems > 0 ? Math.min(1, processedItems / totalItems) : 0;

      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          processedItems,
          progress,
          status: 'running',
        } as Prisma.TaskUncheckedUpdateInput,
      });
    };

    try {
      for (const group of groups) {
        const ownerId = this.toGroupOwnerId(group.vkId);
        if (this.isGroupWallDisabled(group)) {
          if (!skippedGroupVkIds.includes(group.vkId)) {
            skippedGroupVkIds.push(group.vkId);
            stats.groups = Math.max(0, stats.groups - 1);
          }
          continue;
        }

        let posts: IPost[];

        try {
          posts = await this.vkService.getGroupRecentPosts({ ownerId, count: postLimit });
        } catch (error) {
          if (this.isWallDisabledApiError(error)) {
            if (!skippedGroupVkIds.includes(group.vkId)) {
              skippedGroupVkIds.push(group.vkId);
              stats.groups = Math.max(0, stats.groups - 1);
            }
            await this.markGroupWallDisabled(group);
            continue;
          }

          throw error;
        }

        for (const post of posts) {
          await this.savePost(post, group);
          stats.posts += 1;

          const { comments, authorIds } = await this.fetchAllComments(ownerId, post.id);

          const newAuthorIds = authorIds
            .filter((id) => id > 0 && !processedAuthorIds.has(id));

          if (newAuthorIds.length) {
            const createdOrUpdated = await this.saveAuthors(newAuthorIds);
            stats.authors += createdOrUpdated;
            newAuthorIds.forEach((id) => processedAuthorIds.add(id));
          }

          if (comments.length) {
            stats.comments += await this.saveComments(comments);
          }
        }

        await updateTaskProgress(1);
      }

      const skippedGroupsMessage = this.buildSkippedGroupsMessage(skippedGroupVkIds);

      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          completed: true,
          processedItems: totalItems,
          progress: 1,
          status: 'done',
          description: JSON.stringify({
            scope,
            groupIds,
            postLimit,
            stats,
            skippedGroupsMessage: skippedGroupsMessage ?? undefined,
          }),
        } as Prisma.TaskUncheckedUpdateInput,
      });

      return {
        taskId: task.id,
        scope,
        postLimit,
        stats,
        skippedGroupsMessage: skippedGroupsMessage ?? undefined,
      };
    } catch (error) {
      const skippedGroupsMessage = this.buildSkippedGroupsMessage(skippedGroupVkIds);

      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'failed',
          description: JSON.stringify({
            scope,
            groupIds,
            postLimit,
            error: error instanceof Error ? error.message : String(error),
            skippedGroupsMessage: skippedGroupsMessage ?? undefined,
          }),
        } as Prisma.TaskUncheckedUpdateInput,
      });

      throw error;
    }
  }

  async getTasks(): Promise<TaskSummary[]> {
    const tasks = await this.prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return tasks.map((task) => this.mapTaskToSummary(task));
  }

  async getTask(taskId: number): Promise<TaskDetail> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.mapTaskToDetail(task);
  }

  private async resolveGroups(scope: ParsingScope, groupIds: number[]): Promise<PrismaGroupRecord[]> {
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

  private mapTaskToDetail(task: PrismaTaskRecord): TaskDetail {
    return {
      ...this.mapTaskToSummary(task),
      description: task.description ?? null,
    };
  }

  private mapTaskToSummary(task: PrismaTaskRecord): TaskSummary {
    const parsed = this.parseTaskDescription(task);
    const totalItems = task.totalItems ?? 0;
    const processedItems = task.processedItems ?? 0;
    const completed = task.completed ?? false;
    const progress = task.progress ?? (completed ? 1 : 0);
    const status = this.parseTaskStatus(task.status) ?? this.resolveTaskStatus(task, parsed);
    return {
      id: task.id,
      title: task.title,
      status,
      completed,
      totalItems,
      processedItems,
      progress,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      scope: parsed.scope,
      groupIds: parsed.groupIds,
      postLimit: parsed.postLimit,
      stats: parsed.stats,
      error: parsed.error,
      skippedGroupsMessage: parsed.skippedGroupsMessage,
    };
  }

  private parseTaskStatus(value: unknown): TaskStatus | null {
    if (typeof value !== 'string') {
      return null;
    }

    const allowed: TaskStatus[] = ['pending', 'running', 'done', 'failed'];
    return allowed.includes(value as TaskStatus) ? (value as TaskStatus) : null;
  }

  private resolveTaskStatus(task: PrismaTaskRecord, parsed: ParsedTaskDescription): TaskStatus {
    if (task.completed === true) {
      return 'done';
    }

    if (parsed.error) {
      return 'failed';
    }

    if ((task.processedItems ?? 0) > 0) {
      return 'running';
    }

    return 'pending';
  }

  private parseTaskDescription(task: PrismaTaskRecord): ParsedTaskDescription {
    const empty = this.createEmptyParsedDescription();

    if (!task.description) {
      return empty;
    }

    try {
      const data = JSON.parse(task.description) as Record<string, unknown>;

      return {
        ...empty,
        scope: this.parseScope(data.scope),
        groupIds: this.parseGroupIds(data.groupIds),
        postLimit: this.parsePostLimit(data.postLimit),
        stats: this.parseStats(data.stats),
        error: typeof data.error === 'string' ? data.error : null,
        skippedGroupsMessage: typeof data.skippedGroupsMessage === 'string'
          ? data.skippedGroupsMessage
          : null,
      };
    } catch {
      return empty;
    }
  }

  private createEmptyParsedDescription(): ParsedTaskDescription {
    return {
      scope: null,
      groupIds: [],
      postLimit: null,
      stats: null,
      error: null,
      skippedGroupsMessage: null,
    };
  }

  private parseScope(value: unknown): ParsingScope | null {
    if (typeof value !== 'string') {
      return null;
    }

    if (Object.values(ParsingScope).includes(value as ParsingScope)) {
      return value as ParsingScope;
    }

    return null;
  }

  private parseGroupIds(value: unknown): number[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => (typeof item === 'number' ? item : Number.isFinite(Number(item)) ? Number(item) : null))
      .filter((item): item is number => item !== null && !Number.isNaN(item));
  }

  private parsePostLimit(value: unknown): number | null {
    const parsed = this.parseNumericField(value);
    return parsed ?? null;
  }

  private parseStats(value: unknown): ParsingStats | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const data = value as Record<string, unknown>;
    const groups = this.parseNumericField(data.groups);
    const posts = this.parseNumericField(data.posts);
    const comments = this.parseNumericField(data.comments);
    const authors = this.parseNumericField(data.authors);

    if ([groups, posts, comments, authors].some((item) => item === null)) {
      return null;
    }

    return {
      groups: groups as number,
      posts: posts as number,
      comments: comments as number,
      authors: authors as number,
    };
  }

  private parseNumericField(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private buildTaskTitle(scope: ParsingScope, groups: PrismaGroupRecord[]): string {
    if (scope === ParsingScope.ALL) {
      return `Парсинг всех групп (${groups.length})`;
    }

    if (groups.length === 1) {
      return `Парсинг группы: ${groups[0].name}`;
    }

    return `Парсинг выбранных групп (${groups.length})`;
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
      // Ignore persistence issues so the parsing task can continue.
    }
  }

  private async savePost(post: IPost, group: PrismaGroupRecord): Promise<void> {
    const postedAt = new Date(post.date * 1000);

    await this.prisma.post.upsert({
      where: {
        ownerId_vkPostId: {
          ownerId: post.owner_id,
          vkPostId: post.id,
        },
      },
      update: {
        groupId: group.id,
        fromId: post.from_id,
        postedAt,
        text: post.text,
        commentsCount: post.comments.count,
        commentsCanPost: post.comments.can_post,
        commentsGroupsCanPost: post.comments.groups_can_post,
        commentsCanClose: post.comments.can_close,
        commentsCanOpen: post.comments.can_open,
      },
      create: {
        ownerId: post.owner_id,
        vkPostId: post.id,
        fromId: post.from_id,
        groupId: group.id,
        postedAt,
        text: post.text,
        commentsCount: post.comments.count,
        commentsCanPost: post.comments.can_post,
        commentsGroupsCanPost: post.comments.groups_can_post,
        commentsCanClose: post.comments.can_close,
        commentsCanOpen: post.comments.can_open,
      },
    });
  }

  private async fetchAllComments(ownerId: number, postId: number): Promise<{ comments: IComment[]; authorIds: number[]; }> {
    const batchSize = 100;
    let offset = 0;
    const collected: IComment[] = [];
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

      collected.push(...items);

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
    const ids = new Set<number>();
    const stack = [...comments];

    while (stack.length) {
      const comment = stack.pop();
      if (!comment) {
        continue;
      }

      if (typeof comment.fromId === 'number') {
        ids.add(comment.fromId);
      }

      if (typeof comment.replyToUser === 'number') {
        ids.add(comment.replyToUser);
      }

      if (comment.threadItems?.length) {
        stack.push(...comment.threadItems);
      }
    }

    return Array.from(ids);
  }

  private async saveComments(comments: IComment[]): Promise<number> {
    let saved = 0;

    for (const comment of comments) {
      const threadItemsJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
        comment.threadItems?.length
          ? (comment.threadItems.map((item) => this.serializeComment(item)) as Prisma.InputJsonValue)
          : Prisma.JsonNull;

      const attachmentsJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined =
        comment.attachments === undefined
          ? undefined
          : comment.attachments === null
            ? Prisma.JsonNull
            : (comment.attachments as Prisma.InputJsonValue);

      await this.prisma.comment.upsert({
        where: {
          ownerId_vkCommentId: {
            ownerId: comment.ownerId,
            vkCommentId: comment.vkCommentId,
          },
        },
        update: {
          postId: comment.postId,
          ownerId: comment.ownerId,
          vkCommentId: comment.vkCommentId,
          fromId: comment.fromId,
          authorVkId: comment.fromId > 0 ? comment.fromId : null,
          text: comment.text,
          publishedAt: comment.publishedAt,
          likesCount: comment.likesCount,
          parentsStack: comment.parentsStack,
          threadCount: comment.threadCount,
          threadItems: threadItemsJson,
          attachments: attachmentsJson,
          replyToUser: comment.replyToUser,
          replyToComment: comment.replyToComment,
          isDeleted: comment.isDeleted,
        },
        create: {
          postId: comment.postId,
          ownerId: comment.ownerId,
          vkCommentId: comment.vkCommentId,
          fromId: comment.fromId,
          authorVkId: comment.fromId > 0 ? comment.fromId : null,
          text: comment.text,
          publishedAt: comment.publishedAt,
          likesCount: comment.likesCount,
          parentsStack: comment.parentsStack,
          threadCount: comment.threadCount,
          threadItems: threadItemsJson,
          attachments: attachmentsJson,
          replyToUser: comment.replyToUser,
          replyToComment: comment.replyToComment,
          isDeleted: comment.isDeleted,
        },
      });

      saved += 1;

      if (comment.threadItems?.length) {
        saved += await this.saveComments(comment.threadItems);
      }
    }

    return saved;
  }

  private serializeComment(comment: IComment): Record<string, unknown> {
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
      await this.prisma.author.upsert({
        where: { vkUserId: author.id },
        update: {
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
        },
        create: {
          vkUserId: author.id,
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
        },
      });
    }

    return authors.length;
  }
}
