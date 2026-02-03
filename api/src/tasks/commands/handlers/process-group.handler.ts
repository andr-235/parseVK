import { CommandHandler, ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { APIError } from 'vk-io';
import { ProcessGroupCommand } from '../impl/process-group.command.js';
import { SavePostCommand } from '../impl/save-post.command.js';
import { SaveCommentsCommand } from '../impl/save-comments.command.js';
import { SaveAuthorsCommand } from '../impl/save-authors.command.js';
import { VkService } from '@/vk/vk.service.js';
import { TaskCancellationService } from '@/tasks/task-cancellation.service.js';
import type { IParsingTaskRepository } from '@/tasks/interfaces/parsing-task-repository.interface.js';
import type { IPost } from '@/vk/interfaces/post.interfaces.js';
import type { IComment } from '@/vk/interfaces/comment.interfaces.js';
import { CommentSource } from '@/common/types/comment-source.enum.js';
import { normalizeComment } from '@/common/utils/comment-normalizer.utils.js';
import type {
  CommentEntity,
  TaskProcessingContext,
} from '@/tasks/interfaces/parsing-task-runner.types.js';
import type { ParsingGroupRecord } from '@/tasks/interfaces/parsing-task-repository.interface.js';
import { GetCommentsResponse } from '@/vk/vk.service.js';

@Injectable()
@CommandHandler(ProcessGroupCommand)
export class ProcessGroupHandler implements ICommandHandler<
  ProcessGroupCommand,
  boolean
> {
  private readonly logger = new Logger(ProcessGroupHandler.name);

  constructor(
    private readonly vkService: VkService,
    private readonly commandBus: CommandBus,
    @Inject('IParsingTaskRepository')
    private readonly repository: IParsingTaskRepository,
    private readonly cancellationService: TaskCancellationService,
  ) {}

  async execute(command: ProcessGroupCommand): Promise<boolean> {
    const { taskId, group, postLimit, context } = command;
    const ownerId = this.toGroupOwnerId(group.vkId);

    try {
      this.cancellationService.throwIfCancelled(taskId);

      // Check if wall disabled
      if (this.isGroupWallDisabled(group)) {
        this.handleSkippedGroup(context, group);
        this.logger.warn(
          `Стена группы ${group.vkId} отключена, группа будет пропущена`,
        );
        return false;
      }

      // Fetch posts
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

      // Process each post
      for (const post of posts) {
        this.cancellationService.throwIfCancelled(taskId);

        // Save post via command
        await this.commandBus.execute(new SavePostCommand(post, group));
        context.stats.posts += 1;

        // Fetch and save comments
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
          const createdOrUpdated: number = await this.commandBus.execute(
            new SaveAuthorsCommand(newAuthorIds),
          );
          context.stats.authors += createdOrUpdated;
          newAuthorIds.forEach((id) => context.processedAuthorIds.add(id));
          this.logger.debug(
            `Задача ${taskId}: обновлено ${createdOrUpdated} авторов после поста ${post.id} группы ${group.vkId}`,
          );
        }

        if (comments.length) {
          this.cancellationService.throwIfCancelled(taskId);
          const savedCount: number = await this.commandBus.execute(
            new SaveCommentsCommand(comments, CommentSource.TASK),
          );
          context.stats.comments += savedCount;
          this.logger.debug(
            `Задача ${taskId}: сохранено ${savedCount} комментариев для поста ${post.id} группы ${group.vkId}`,
          );
        }
      }

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorText = this.isTemporaryVkApiError(error)
        ? `Временная ошибка VK API: ${errorMessage}`
        : errorMessage;

      context.failedGroups.push({
        vkId: group.vkId,
        name: group.name,
        error: errorText,
      });

      this.logger.error(
        `Задача ${taskId}: ошибка при обработке группы ${group.vkId}: ${errorText}`,
      );
      return false;
    }
  }

  // Helper methods
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

      const response: GetCommentsResponse = await this.vkService.getComments({
        ownerId,
        postId,
        count: batchSize,
        offset,
        needLikes: true,
        extended: true,
        threadItemsCount: 10,
      });

      const items: IComment[] = response.items ?? [];

      if (!items.length) {
        break;
      }

      collected.push(...items.map((item) => normalizeComment(item)));

      const collectedIds = this.collectAuthorIds(items);
      collectedIds.forEach((id) => authorIds.add(id));

      if (response.profiles && Array.isArray(response.profiles)) {
        response.profiles.forEach((profile) => {
          if (profile && typeof profile === 'object' && 'id' in profile) {
            const profileId = (profile as Record<string, unknown>).id;
            if (typeof profileId === 'number') {
              authorIds.add(profileId);
            }
          }
        });
      }

      offset += items.length;

      if (items.length < batchSize) {
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
    for (const comment of comments) {
      if (comment.fromId && comment.fromId > 0) {
        ids.add(comment.fromId);
      }

      if (comment.threadItems) {
        const threadIds = this.collectAuthorIds(comment.threadItems);
        threadIds.forEach((id) => ids.add(id));
      }
    }
    return Array.from(ids);
  }

  private extractNewAuthorIds(
    authorIds: number[],
    processedAuthorIds: Set<number>,
  ): number[] {
    return authorIds.filter((id) => id > 0 && !processedAuthorIds.has(id));
  }

  private handleSkippedGroup(
    context: TaskProcessingContext,
    group: ParsingGroupRecord,
  ): void {
    if (!context.skippedGroupVkIds.includes(group.vkId)) {
      context.skippedGroupVkIds.push(group.vkId);
      context.stats.groups = Math.max(0, context.stats.groups - 1);
    }
  }

  private toGroupOwnerId(vkGroupId: number): number {
    return -Math.abs(vkGroupId);
  }

  private isGroupWallDisabled(group: ParsingGroupRecord): boolean {
    return typeof group.wall === 'number' && group.wall === 0;
  }

  private isWallDisabledApiError(error: unknown): boolean {
    return error instanceof APIError && error.code === 15;
  }

  private isTemporaryVkApiError(error: unknown): boolean {
    if (this.isTimeoutError(error)) {
      return true;
    }

    if (error instanceof APIError) {
      return error.code === 6 || error.code === 9 || error.code === 10;
    }

    return false;
  }

  private isTimeoutError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    if (error instanceof Error) {
      const err = error as Error & {
        code?: string;
        cause?: { code?: string };
      };
      const code = err.code ?? err.cause?.code;
      const name = err.name?.toLowerCase() ?? '';
      const message = err.message.toLowerCase();

      if (name === 'aborterror') {
        return true;
      }

      if (code === 'ETIMEDOUT' || code === 'ECONNABORTED') {
        return true;
      }

      if (message.includes('timeout') || message.includes('timed out')) {
        return true;
      }
    }

    return false;
  }

  private async markGroupWallDisabled(
    group: ParsingGroupRecord,
  ): Promise<void> {
    if (group.wall === 0) {
      return;
    }

    try {
      await this.repository.updateGroupWall(group.id, 0);
    } catch {
      // Игнорируем ошибки сохранения
    }
  }
}
