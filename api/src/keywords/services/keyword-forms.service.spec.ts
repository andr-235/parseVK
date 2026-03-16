import { describe, expect, it, vi, beforeEach } from 'vitest';
import { KeywordFormsService } from './keyword-forms.service.js';
import type { IKeywordsRepository } from '../interfaces/keywords-repository.interface.js';
import type { KeywordMorphologyService } from './keyword-morphology.service.js';

describe('KeywordFormsService', () => {
  let repositoryMock: vi.Mocked<IKeywordsRepository>;
  let morphologyMock: {
    generateForms: ReturnType<typeof vi.fn>;
  };
  let service: KeywordFormsService;

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
      removeGeneratedFormExclusion: vi.fn(),
      findManyWithSelect: vi.fn(),
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

    morphologyMock = {
      generateForms: vi.fn(),
    };

    service = new KeywordFormsService(
      repositoryMock,
      morphologyMock as unknown as KeywordMorphologyService,
    );
  });

  it('replaces generated forms while respecting exclusions', async () => {
    repositoryMock.findUniqueWithForms.mockResolvedValue({
      id: 1,
      word: 'клоун',
      category: null,
      isPhrase: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      keywordForms: [
        {
          id: 10,
          keywordId: 1,
          form: 'клоунами',
          source: 'manual',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      keywordFormExclusions: [
        { id: 20, keywordId: 1, form: 'клоуном', createdAt: new Date() },
      ],
      commentKeywordMatches: [],
    });
    morphologyMock.generateForms.mockResolvedValue([
      'клоун',
      'клоуна',
      'клоуном',
      'клоунов',
    ]);

    await service.syncGeneratedForms(1, 'клоун', false);

    expect(repositoryMock.replaceGeneratedForms).toHaveBeenCalledWith(1, [
      'клоун',
      'клоуна',
      'клоунов',
    ]);
  });

  it('adds manual form in normalized form', async () => {
    await service.addManualForm(1, '  КЛОУНАМИ ');

    expect(repositoryMock.addManualForm).toHaveBeenCalledWith(1, 'клоунами');
  });

  it('removes generated exclusion in normalized form', async () => {
    await service.removeGeneratedFormExclusion(1, '  КЛОУНОМ ');

    expect(repositoryMock.removeGeneratedFormExclusion).toHaveBeenCalledWith(
      1,
      'клоуном',
    );
  });
});
