import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { SavePostCommand } from '../impl/save-post.command.js';
import type { IParsingTaskRepository } from '@/tasks/interfaces/parsing-task-repository.interface.js';

@Injectable()
@CommandHandler(SavePostCommand)
export class SavePostHandler implements ICommandHandler<SavePostCommand, void> {
  constructor(
    @Inject('IParsingTaskRepository')
    private readonly repository: IParsingTaskRepository,
  ) {}

  async execute(command: SavePostCommand): Promise<void> {
    const { post, group } = command;
    const postedAt = new Date(post.date * 1000);
    const attachments = post.attachments ?? undefined;

    await this.repository.upsertPost({
      ownerId: post.owner_id,
      vkPostId: post.id,
      groupId: group.id,
      fromId: post.from_id,
      postedAt,
      text: post.text,
      commentsCount: post.comments.count,
      commentsCanPost: post.comments.can_post,
      commentsGroupsCanPost: post.comments.groups_can_post,
      commentsCanClose: post.comments.can_close,
      commentsCanOpen: post.comments.can_open,
      attachments,
    });
  }
}
