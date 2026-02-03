import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { SaveAuthorsCommand } from '../impl/save-authors.command.js';
import { AuthorActivityService } from '@/common/services/author-activity.service.js';

@Injectable()
@CommandHandler(SaveAuthorsCommand)
export class SaveAuthorsHandler implements ICommandHandler<
  SaveAuthorsCommand,
  number
> {
  constructor(private readonly authorActivityService: AuthorActivityService) {}

  async execute(command: SaveAuthorsCommand): Promise<number> {
    return this.authorActivityService.saveAuthors(command.authorIds);
  }
}
