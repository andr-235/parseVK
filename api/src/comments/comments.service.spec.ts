import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: { comment: { findMany: jest.Mock; update: jest.Mock } };

  beforeEach(() => {
    prisma = {
      comment: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new CommentsService(prisma as unknown as PrismaService);
  });

  it('должен маппить данные автора и выставлять author: null при отсутствии данных', async () => {
    const commentsFromPrisma = [
      {
        id: 1,
        text: 'Комментарий с автором',
        publishedAt: new Date('2024-01-01T00:00:00.000Z'),
        authorVkId: 100,
        author: {
          vkUserId: 100,
          firstName: 'Иван',
          lastName: 'Иванов',
          photo50: null,
          photo100: 'https://example.com/photo100.jpg',
          photo200Orig: null,
        },
        isRead: true,
      },
      {
        id: 2,
        text: 'Комментарий без автора',
        publishedAt: new Date('2024-01-02T00:00:00.000Z'),
        authorVkId: null,
        author: null,
        isRead: false,
      },
    ] as never;

    prisma.comment.findMany.mockResolvedValue(commentsFromPrisma);

    const result = await service.getAllComments();

    expect(result).toEqual([
      {
        ...commentsFromPrisma[0],
        author: {
          vkUserId: 100,
          firstName: 'Иван',
          lastName: 'Иванов',
          logo: 'https://example.com/photo100.jpg',
        },
      },
      {
        ...commentsFromPrisma[1],
        author: null,
      },
    ]);
  });

  it('должен запрашивать комментарии, отсортированные по publishedAt', async () => {
    prisma.comment.findMany.mockResolvedValue([]);

    await service.getAllComments();

    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      orderBy: { publishedAt: 'desc' },
      include: {
        author: {
          select: {
            vkUserId: true,
            firstName: true,
            lastName: true,
            photo50: true,
            photo100: true,
            photo200Orig: true,
          },
        },
      },
    });
  });

  it('должен обновлять статус прочтения комментария', async () => {
    const comment = {
      id: 1,
      text: 'Комментарий',
      publishedAt: new Date('2024-01-01T00:00:00.000Z'),
      authorVkId: 100,
      isRead: true,
      author: {
        vkUserId: 100,
        firstName: 'Иван',
        lastName: 'Иванов',
        photo50: null,
        photo100: 'https://example.com/photo100.jpg',
        photo200Orig: null,
      },
    } as never;

    prisma.comment.update.mockResolvedValue(comment);

    await expect(service.setReadStatus(1, true)).resolves.toEqual({
      ...comment,
      author: {
        vkUserId: 100,
        firstName: 'Иван',
        lastName: 'Иванов',
        logo: 'https://example.com/photo100.jpg',
      },
    });

    expect(prisma.comment.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isRead: true },
      include: {
        author: {
          select: {
            vkUserId: true,
            firstName: true,
            lastName: true,
            photo50: true,
            photo100: true,
            photo200Orig: true,
          },
        },
      },
    });
  });
});
