import { Test, TestingModule } from '@nestjs/testing';
import { CommentsRepository } from './comments.repository';
import { PrismaService } from '../../prisma.service';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface';

describe('CommentsRepository', () => {
  let repository: CommentsRepository;
  let prismaService: {
    comment: {
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prismaService = {
      comment: {
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsRepository,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    repository = module.get<CommentsRepository>(CommentsRepository);
  });

  describe('findMany', () => {
    it('должен вызывать prisma.comment.findMany с правильными параметрами', async () => {
      const params = {
        where: { isRead: true },
        skip: 0,
        take: 10,
        orderBy: { publishedAt: 'desc' },
      };

      const mockComments: CommentWithRelations[] = [
        {
          id: 1,
          text: 'Test',
          publishedAt: new Date(),
          isRead: true,
          watchlistAuthorId: null,
          author: null,
          commentKeywordMatches: [],
        },
      ];

      prismaService.comment.findMany.mockResolvedValue(mockComments);

      const result = await repository.findMany(params);

      expect(result).toBe(mockComments);
      expect(prismaService.comment.findMany).toHaveBeenCalledWith({
        ...params,
        include: expect.any(Object),
      });
    });
  });

  describe('count', () => {
    it('должен вызывать prisma.comment.count с правильными параметрами', async () => {
      const params = {
        where: { isRead: true },
      };

      prismaService.comment.count.mockResolvedValue(10);

      const result = await repository.count(params);

      expect(result).toBe(10);
      expect(prismaService.comment.count).toHaveBeenCalledWith(params);
    });
  });

  describe('update', () => {
    it('должен вызывать prisma.comment.update с правильными параметрами', async () => {
      const params = {
        where: { id: 1 },
        data: { isRead: true },
      };

      const mockComment: CommentWithRelations = {
        id: 1,
        text: 'Test',
        publishedAt: new Date(),
        isRead: true,
        watchlistAuthorId: null,
        author: null,
        commentKeywordMatches: [],
      };

      prismaService.comment.update.mockResolvedValue(mockComment);

      const result = await repository.update(params);

      expect(result).toBe(mockComment);
      expect(prismaService.comment.update).toHaveBeenCalledWith({
        ...params,
        include: expect.any(Object),
      });
    });
  });

  describe('transaction', () => {
    it('должен вызывать prisma.$transaction с массивом промисов', async () => {
      const queries = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3),
      ];

      prismaService.$transaction.mockResolvedValue([1, 2, 3]);

      const result = await repository.transaction(queries);

      expect(result).toEqual([1, 2, 3]);
      expect(prismaService.$transaction).toHaveBeenCalledWith(queries);
    });
  });
});

