import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { SaveCommentsCommand } from '../impl/save-comments.command.js';
import { AuthorActivityService } from '@/common/services/author-activity.service.js';

@Injectable()
@CommandHandler(SaveCommentsCommand)
export class SaveCommentsHandler implements ICommandHandler<
  SaveCommentsCommand,
  number
> {
  constructor(private readonly authorActivityService: AuthorActivityService) {}

  async execute(command: SaveCommentsCommand): Promise<number> {
    return this.authorActivityService.saveComments(command.comments, {
      source: command.source,
    });
  }
}
