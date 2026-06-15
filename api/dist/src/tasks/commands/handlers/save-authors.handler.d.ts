import { ICommandHandler } from '@nestjs/cqrs';
import { SaveAuthorsCommand } from '../impl/save-authors.command.js';
import { AuthorsSaverService } from '../../../common/services/authors-saver.service.js';
export declare class SaveAuthorsHandler implements ICommandHandler<SaveAuthorsCommand, number> {
    private readonly authorsSaver;
    constructor(authorsSaver: AuthorsSaverService);
    execute(command: SaveAuthorsCommand): Promise<number>;
}
