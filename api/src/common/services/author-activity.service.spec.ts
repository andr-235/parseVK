import { vi } from 'vitest';
import { CommentSource } from '../types/comment-source.enum.js';
import { AuthorActivityService } from './author-activity.service.js';
import type { AuthorsSaverService } from './authors-saver.service.js';
import type { CommentsSaverService } from './comments-saver.service.js';
import type { CommentEntity } from '../types/comment-entity.type.js';

describe('AuthorActivityService (фасад)', () => {
  let service: AuthorActivityService;
  let authorsSaverMock: {
    saveAuthors: ReturnType<typeof vi.fn>;
    refreshAllAuthors: ReturnType<typeof vi.fn>;
  };
  let commentsSaverMock: {
    saveComments: ReturnType<typeof vi.fn>;
  };

  const baseComment: CommentEntity = {
    postId: 1,
    ownerId: 1,
    vkCommentId: 101,
    fromId: 5,
    text: 'Тест',
    publishedAt: new Date('2024-01-01T00:00:00.000Z'),
    likesCount: null,
    parentsStack: null,
    threadCount: null,
    threadItems: null,
    attachments: null,
    replyToUser: null,
    replyToComment: null,
    isDeleted: false,
  };

  beforeEach(() => {
    authorsSaverMock = {
      saveAuthors: vi.fn().mockResolvedValue(0),
      refreshAllAuthors: vi.fn().mockResolvedValue(0),
    };
    commentsSaverMock = {
      saveComments: vi.fn().mockResolvedValue(0),
    };

    service = new AuthorActivityService(
      authorsSaverMock as unknown as AuthorsSaverService,
      commentsSaverMock as unknown as CommentsSaverService,
    );
  });

  it('saveComments делегирует в CommentsSaverService', async () => {
    const opts = { source: CommentSource.TASK };
    await service.saveComments([baseComment], opts);
    expect(commentsSaverMock.saveComments).toHaveBeenCalledWith(
      [baseComment],
      opts,
    );
  });

  it('saveAuthors делегирует в AuthorsSaverService', async () => {
    await service.saveAuthors([1, 2, 3]);
    expect(authorsSaverMock.saveAuthors).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('refreshAllAuthors делегирует в AuthorsSaverService', async () => {
    await service.refreshAllAuthors(100);
    expect(authorsSaverMock.refreshAllAuthors).toHaveBeenCalledWith(100);
  });
});
