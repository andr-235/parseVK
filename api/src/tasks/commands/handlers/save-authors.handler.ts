import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { SaveAuthorsCommand } from '../impl/save-authors.command.js';
import { AuthorsSaverService } from '@/common/services/authors-saver.service.js';

@Injectable()
@CommandHandler(SaveAuthorsCommand)
export class SaveAuthorsHandler implements ICommandHandler<
  SaveAuthorsCommand,
  number
> {
  constructor(private readonly authorsSaver: AuthorsSaverService) {}

  async execute(command: SaveAuthorsCommand): Promise<number> {
    return this.authorsSaver.saveAuthors(command.authorIds);
  }
}
