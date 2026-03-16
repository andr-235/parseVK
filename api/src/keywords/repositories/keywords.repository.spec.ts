import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { KeywordsRepository } from './keywords.repository.js';
import { PrismaService } from '../../prisma.service.js';

describe('KeywordsRepository', () => {
  let repository: KeywordsRepository;
  let prismaService: {
    keyword: {
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    keywordForm: {
      create: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
      createMany: ReturnType<typeof vi.fn>;
    };
    keywordFormExclusion: {
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prismaService = {
      keyword: {
        findUniqueOrThrow: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      keywordForm: {
        create: vi.fn(),
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      keywordFormExclusion: {
        create: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeywordsRepository,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    repository = module.get(KeywordsRepository);
  });

  it('loads keyword with forms and exclusions', async () => {
    prismaService.keyword.findUniqueOrThrow.mockResolvedValue({
      id: 1,
      word: 'клоун',
      keywordForms: [{ id: 10, form: 'клоунов', source: 'generated' }],
      keywordFormExclusions: [{ id: 20, form: 'клоунами' }],
    });

    const result = await repository.findUniqueWithForms({ id: 1 });

    expect(result).toMatchObject({
      id: 1,
      keywordForms: [{ form: 'клоунов', source: 'generated' }],
      keywordFormExclusions: [{ form: 'клоунами' }],
    });
    expect(prismaService.keyword.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        keywordForms: true,
        keywordFormExclusions: true,
      },
    });
  });

  it('replaces generated forms for a keyword', async () => {
    await repository.replaceGeneratedForms(1, ['клоун', 'клоунов']);

    expect(prismaService.keywordForm.deleteMany).toHaveBeenCalledWith({
      where: { keywordId: 1, source: 'generated' },
    });
    expect(prismaService.keywordForm.createMany).toHaveBeenCalledWith({
      data: [
        { keywordId: 1, form: 'клоун', source: 'generated' },
        { keywordId: 1, form: 'клоунов', source: 'generated' },
      ],
      skipDuplicates: true,
    });
  });

  it('adds manual form for keyword', async () => {
    await repository.addManualForm(1, 'клоунами');

    expect(prismaService.keywordForm.create).toHaveBeenCalledWith({
      data: {
        keywordId: 1,
        form: 'клоунами',
        source: 'manual',
      },
    });
  });

  it('creates exclusion for generated form', async () => {
    await repository.excludeGeneratedForm(1, 'клоуном');

    expect(prismaService.keywordFormExclusion.create).toHaveBeenCalledWith({
      data: {
        keywordId: 1,
        form: 'клоуном',
      },
    });
  });
});
