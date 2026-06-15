import { ICommandHandler } from '@nestjs/cqrs';
import { SaveCommentsCommand } from '../impl/save-comments.command.js';
import { CommentsSaverService } from '../../../common/services/comments-saver.service.js';
export declare class SaveCommentsHandler implements ICommandHandler<SaveCommentsCommand, number> {
    private readonly commentsSaver;
    constructor(commentsSaver: CommentsSaverService);
    execute(command: SaveCommentsCommand): Promise<number>;
}
