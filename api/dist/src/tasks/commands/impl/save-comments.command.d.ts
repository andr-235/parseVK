import type { CommentEntity } from '../../../tasks/interfaces/parsing-task-runner.types.js';
import type { CommentSource } from '../../../common/types/comment-source.enum.js';
export declare class SaveCommentsCommand {
    readonly comments: CommentEntity[];
    readonly source: CommentSource;
    constructor(comments: CommentEntity[], source: CommentSource);
}
