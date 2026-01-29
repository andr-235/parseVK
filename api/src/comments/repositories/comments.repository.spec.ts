import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client.js';
import { CommentsRepository } from './comments.repository.js';
import { PrismaService } from '../../prisma.service.js';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface.js';

const createMockPost = () => ({
  text: 'Post text',
  attachments: null,
  group: null,
});

const createMockComment = (overrides = {}): CommentWithRelations =>
  ({
    id: 1,
    postId: 1,
    ownerId: -123,
    vkCommentId: 456,
    fromId: 123,
    text: 'Test',
    publishedAt: new Date(),
    likesCount: null,
    parentsStack: null,
    threadCount: null,
    threadItems: null,
    attachments: null,
    replyToUser: null,
    replyToComment: null,
    isRead: false,
    isDeleted: false,
    source: 'TASK',
    watchlistAuthorId: null,
    authorVkId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: null,
    commentKeywordMatches: [],
    post: createMockPost(),
    ...overrides,
  }) as CommentWithRelations;

describe('CommentsRepository', () => {
  let repository: CommentsRepository;
  let prismaService: {
    comment: {
      findMany: vi.Mock;
      count: vi.Mock;
      update: vi.Mock;
    };
    $transaction: vi.Mock;
  };

  beforeEach(async () => {
    prismaService = {
      comment: {
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
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
        orderBy: { publishedAt: 'desc' as const },
      };

      const mockComments: CommentWithRelations[] = [
        createMockComment({
          id: 1,
          isRead: true,
        }),
      ];

      prismaService.comment.findMany.mockResolvedValue(mockComments);

      const result = await repository.findMany(params);

      expect(result).toBe(mockComments);

      expect(prismaService.comment.findMany).toHaveBeenCalledWith({
        ...params,
        include: expect.any(Object) as unknown,
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

      const mockComment = createMockComment({
        id: 1,
        isRead: true,
      }) as unknown as CommentWithRelations;

      prismaService.comment.update.mockResolvedValue(mockComment);

      const result = await repository.update(params);

      expect(result).toBe(mockComment);

      expect(prismaService.comment.update).toHaveBeenCalledWith({
        ...params,
        include: expect.any(Object) as unknown,
      });
    });
  });

  describe('transaction', () => {
    it('должен вызывать prisma.$transaction с массивом промисов', async () => {
      const queries: Prisma.PrismaPromise<number>[] = [
        Promise.resolve(1) as Prisma.PrismaPromise<number>,
        Promise.resolve(2) as Prisma.PrismaPromise<number>,
        Promise.resolve(3) as Prisma.PrismaPromise<number>,
      ];

      prismaService.$transaction.mockResolvedValue([1, 2, 3]);

      const result = await repository.transaction(queries);

      expect(result).toEqual([1, 2, 3]);
      expect(prismaService.$transaction).toHaveBeenCalledWith(queries);
    });
  });
});
