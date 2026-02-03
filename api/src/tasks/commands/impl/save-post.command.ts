import type { IPost } from '@/vk/interfaces/post.interfaces.js';
import type { ParsingGroupRecord } from '@/tasks/interfaces/parsing-task-repository.interface.js';

export class SavePostCommand {
  constructor(
    public readonly post: IPost,
    public readonly group: ParsingGroupRecord,
  ) {}
}
