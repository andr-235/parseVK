import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { SaveCommentsCommand } from '../impl/save-comments.command.js';
import { CommentsSaverService } from '@/common/services/comments-saver.service.js';

@Injectable()
@CommandHandler(SaveCommentsCommand)
export class SaveCommentsHandler implements ICommandHandler<
  SaveCommentsCommand,
  number
> {
  constructor(private readonly commentsSaver: CommentsSaverService) {}

  async execute(command: SaveCommentsCommand): Promise<number> {
    return this.commentsSaver.saveComments(command.comments, {
      source: command.source,
    });
  }
}
