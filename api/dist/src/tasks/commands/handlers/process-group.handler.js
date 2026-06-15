var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProcessGroupHandler_1;
import { CommandHandler, CommandBus } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { APIError } from 'vk-io';
import { ProcessGroupCommand } from '../impl/process-group.command.js';
import { SavePostCommand } from '../impl/save-post.command.js';
import { SaveCommentsCommand } from '../impl/save-comments.command.js';
import { SaveAuthorsCommand } from '../impl/save-authors.command.js';
import { VkService } from '../../../vk/vk.service.js';
import { TaskCancellationService } from '../../../tasks/task-cancellation.service.js';
import { CommentSource } from '../../../common/types/comment-source.enum.js';
import { normalizeComment } from '../../../common/utils/comment-normalizer.utils.js';
import { ParsingTaskMode } from '../../../tasks/dto/create-parsing-task.dto.js';
import { TASK_COMMENTS_BATCH_SIZE, TASK_COMMENTS_THREAD_ITEMS_COUNT, } from '../../../common/constants/processing.constants.js';
let ProcessGroupHandler = ProcessGroupHandler_1 = class ProcessGroupHandler {
    vkService;
    commandBus;
    repository;
    cancellationService;
    logger = new Logger(ProcessGroupHandler_1.name);
    constructor(vkService, commandBus, repository, cancellationService) {
        this.vkService = vkService;
        this.commandBus = commandBus;
        this.repository = repository;
        this.cancellationService = cancellationService;
    }
    async execute(command) {
        const { taskId, group, mode, postLimit, context } = command;
        const ownerId = this.toGroupOwnerId(group.vkId);
        try {
            this.cancellationService.throwIfCancelled(taskId);
            if (this.isGroupWallDisabled(group)) {
                this.handleSkippedGroup(context, group);
                this.logger.warn(`Стена группы ${group.vkId} отключена, группа будет пропущена`);
                return false;
            }
            try {
                if (mode === ParsingTaskMode.RECHECK_GROUP) {
                    let totalPosts = 0;
                    for await (const posts of this.vkService.iterateGroupPosts({
                        ownerId,
                    })) {
                        totalPosts += posts.length;
                        await this.processPostsBatch(posts, group, context, taskId, ownerId);
                    }
                    this.logger.log(`Задача ${taskId}: получено ${totalPosts} постов для группы ${group.vkId}`);
                    return true;
                }
                const posts = await this.vkService.getGroupRecentPosts({
                    ownerId,
                    count: postLimit ?? undefined,
                });
                this.logger.log(`Задача ${taskId}: получено ${posts.length} постов для группы ${group.vkId}`);
                await this.processPostsBatch(posts, group, context, taskId, ownerId);
                return true;
            }
            catch (error) {
                if (this.isWallDisabledApiError(error)) {
                    this.handleSkippedGroup(context, group);
                    await this.markGroupWallDisabled(group);
                    this.logger.warn(`Группа ${group.vkId} имеет отключенную стену (по данным API), группа будет пропущена`);
                    return false;
                }
                throw error;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorText = this.isTemporaryVkApiError(error)
                ? `Временная ошибка VK API: ${errorMessage}`
                : errorMessage;
            context.failedGroups.push({
                vkId: group.vkId,
                name: group.name,
                error: errorText,
            });
            this.logger.error(`Задача ${taskId}: ошибка при обработке группы ${group.vkId}: ${errorText}`);
            return false;
        }
    }
    async processPostsBatch(posts, group, context, taskId, ownerId) {
        for (const post of posts) {
            this.cancellationService.throwIfCancelled(taskId);
            await this.commandBus.execute(new SavePostCommand(post, group));
            context.stats.posts += 1;
            const { comments, authorIds } = await this.fetchAllComments(ownerId, post.id, taskId);
            const newAuthorIds = this.extractNewAuthorIds(authorIds, context.processedAuthorIds);
            if (newAuthorIds.length) {
                this.cancellationService.throwIfCancelled(taskId);
                const createdOrUpdated = await this.commandBus.execute(new SaveAuthorsCommand(newAuthorIds));
                context.stats.authors += createdOrUpdated;
                newAuthorIds.forEach((id) => context.processedAuthorIds.add(id));
                this.logger.debug(`Задача ${taskId}: обновлено ${createdOrUpdated} авторов после поста ${post.id} группы ${group.vkId}`);
            }
            if (comments.length) {
                this.cancellationService.throwIfCancelled(taskId);
                const savedCount = await this.commandBus.execute(new SaveCommentsCommand(comments, CommentSource.TASK));
                context.stats.comments += savedCount;
                this.logger.debug(`Задача ${taskId}: сохранено ${savedCount} комментариев для поста ${post.id} группы ${group.vkId}`);
            }
        }
    }
    async fetchAllComments(ownerId, postId, taskId) {
        const batchSize = TASK_COMMENTS_BATCH_SIZE;
        let offset = 0;
        const collected = [];
        const authorIds = new Set();
        while (true) {
            this.cancellationService.throwIfCancelled(taskId);
            const response = await this.vkService.getComments({
                ownerId,
                postId,
                count: batchSize,
                offset,
                needLikes: true,
                extended: true,
                threadItemsCount: TASK_COMMENTS_THREAD_ITEMS_COUNT,
            });
            const items = response.items ?? [];
            if (!items.length) {
                break;
            }
            collected.push(...items.map((item) => normalizeComment(item)));
            const collectedIds = this.collectAuthorIds(items);
            collectedIds.forEach((id) => authorIds.add(id));
            if (response.profiles && Array.isArray(response.profiles)) {
                response.profiles.forEach((profile) => {
                    if (profile && typeof profile === 'object' && 'id' in profile) {
                        const profileId = profile.id;
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
    collectAuthorIds(comments) {
        const ids = new Set();
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
    extractNewAuthorIds(authorIds, processedAuthorIds) {
        return authorIds.filter((id) => id > 0 && !processedAuthorIds.has(id));
    }
    handleSkippedGroup(context, group) {
        if (!context.skippedGroupVkIds.includes(group.vkId)) {
            context.skippedGroupVkIds.push(group.vkId);
            context.stats.groups = Math.max(0, context.stats.groups - 1);
        }
    }
    toGroupOwnerId(vkGroupId) {
        return -Math.abs(vkGroupId);
    }
    isGroupWallDisabled(group) {
        return typeof group.wall === 'number' && group.wall === 0;
    }
    isWallDisabledApiError(error) {
        return error instanceof APIError && error.code === 15;
    }
    isTemporaryVkApiError(error) {
        if (this.isTimeoutError(error)) {
            return true;
        }
        if (error instanceof APIError) {
            return error.code === 6 || error.code === 9 || error.code === 10;
        }
        return false;
    }
    isTimeoutError(error) {
        if (!error || typeof error !== 'object') {
            return false;
        }
        if (error instanceof Error) {
            const err = error;
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
    async markGroupWallDisabled(group) {
        if (group.wall === 0) {
            return;
        }
        try {
            await this.repository.updateGroupWall(group.id, 0);
        }
        catch {
        }
    }
};
ProcessGroupHandler = ProcessGroupHandler_1 = __decorate([
    Injectable(),
    CommandHandler(ProcessGroupCommand),
    __param(2, Inject('IParsingTaskRepository')),
    __metadata("design:paramtypes", [VkService,
        CommandBus, Object, TaskCancellationService])
], ProcessGroupHandler);
export { ProcessGroupHandler };
//# sourceMappingURL=process-group.handler.js.map