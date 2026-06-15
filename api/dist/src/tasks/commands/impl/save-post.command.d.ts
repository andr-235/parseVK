import type { IPost } from '../../../vk/interfaces/post.interfaces.js';
import type { ParsingGroupRecord } from '../../../tasks/interfaces/parsing-task-repository.interface.js';
export declare class SavePostCommand {
    readonly post: IPost;
    readonly group: ParsingGroupRecord;
    constructor(post: IPost, group: ParsingGroupRecord);
}
