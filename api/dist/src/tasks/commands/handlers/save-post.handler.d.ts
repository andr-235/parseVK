import { ICommandHandler } from '@nestjs/cqrs';
import { SavePostCommand } from '../impl/save-post.command.js';
import type { IParsingTaskRepository } from '../../../tasks/interfaces/parsing-task-repository.interface.js';
export declare class SavePostHandler implements ICommandHandler<SavePostCommand, void> {
    private readonly repository;
    constructor(repository: IParsingTaskRepository);
    execute(command: SavePostCommand): Promise<void>;
}
