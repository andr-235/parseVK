import { describe, expect, it, vi, beforeEach } from 'vitest';
import { KeywordsMatchesService } from './keywords-matches.service.js';
import type { IKeywordsRepository } from '../interfaces/keywords-repository.interface.js';

describe('KeywordsMatchesService', () => {
  let repositoryMock: vi.Mocked<IKeywordsRepository>;
  let service: KeywordsMatchesService;

  beforeEach(() => {
    repositoryMock = {
      findUnique: vi.fn(),
      findUniqueWithForms: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      replaceGeneratedForms: vi.fn(),
      addManualForm: vi.fn(),
      removeManualForm: vi.fn(),
      excludeGeneratedForm: vi.fn(),
      findManyWithSelect: vi.fn(),
      findManyForMatching: vi.fn(),
      countComments: vi.fn(),
      countPosts: vi.fn(),
      findCommentsBatch: vi.fn(),
      findPostsBatch: vi.fn(),
      findCommentsByPost: vi.fn(),
      findCommentKeywordMatches: vi.fn(),
      findPostKeywordMatches: vi.fn(),
      deleteCommentKeywordMatches: vi.fn(),
      deletePostKeywordMatches: vi.fn(),
      createCommentKeywordMatches: vi.fn(),
    } as unknown as vi.Mocked<IKeywordsRepository>;

    service = new KeywordsMatchesService(repositoryMock);
    repositoryMock.findManyForMatching.mockResolvedValue([]);
    repositoryMock.countComments.mockResolvedValue(0);
    repositoryMock.countPosts.mockResolvedValue(0);
  });

  it('пересчитывает comment matches по словоформам keyword', async () => {
    repositoryMock.findManyForMatching.mockResolvedValue([
      {
        id: 11,
        word: 'клоун',
        isPhrase: false,
        keywordForms: [{ form: 'клоунов' }],
      },
    ]);
    repositoryMock.countComments.mockResolvedValue(1);
    repositoryMock.findCommentsBatch.mockResolvedValue([
      { id: 10, text: 'Вижу клоунов в комментариях' },
    ]);
    repositoryMock.findCommentKeywordMatches.mockResolvedValue([]);

    await service.recalculateKeywordMatches();

    expect(repositoryMock.createCommentKeywordMatches).toHaveBeenCalledWith([
      { commentId: 10, keywordId: 11, source: 'COMMENT' },
    ]);
  });

  it('пересчитывает post matches по словоформам keyword', async () => {
    repositoryMock.findManyForMatching.mockResolvedValue([
      {
        id: 12,
        word: 'ауешник',
        isPhrase: false,
        keywordForms: [{ form: 'ауешников' }],
      },
    ]);
    repositoryMock.countPosts.mockResolvedValue(1);
    repositoryMock.findPostsBatch.mockResolvedValue([
      {
        id: 1,
        ownerId: -100,
        vkPostId: 77,
        text: 'В посте обсуждают ауешников',
      },
    ]);
    repositoryMock.findCommentsByPost.mockResolvedValue([{ id: 90 }]);
    repositoryMock.findPostKeywordMatches.mockResolvedValue([]);

    await service.recalculateKeywordMatches();

    expect(repositoryMock.createCommentKeywordMatches).toHaveBeenCalledWith([
      { commentId: 90, keywordId: 12, source: 'POST' },
    ]);
  });
});
