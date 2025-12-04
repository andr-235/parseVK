import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsQueryValidator } from './validators/comments-query.validator';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsService: {
    getComments: jest.Mock;
    getCommentsCursor: jest.Mock;
    setReadStatus: jest.Mock;
  };
  let queryValidator: {
    normalizeOffset: jest.Mock;
    normalizeLimit: jest.Mock;
    normalizeLimitWithDefault: jest.Mock;
    parseKeywords: jest.Mock;
    normalizeReadStatus: jest.Mock;
    normalizeSearch: jest.Mock;
  };

  beforeEach(async () => {
    commentsService = {
      getComments: jest.fn(),
      getCommentsCursor: jest.fn(),
      setReadStatus: jest.fn(),
    };

    queryValidator = {
      normalizeOffset: jest.fn((val: number) => Math.max(val, 0)),
      normalizeLimit: jest.fn((val: number) => Math.min(Math.max(val, 1), 200)),
      normalizeLimitWithDefault: jest.fn((val: number | undefined) =>
        Math.min(Math.max(val ?? 100, 1), 200),
      ),
      parseKeywords: jest.fn((val: string | string[] | undefined) => {
        if (!val) return undefined;
        const values = Array.isArray(val) ? val : val.split(',');
        return values.map((v: string) => v.trim()).filter((v: string) => v);
      }),
      normalizeReadStatus: jest.fn((val: string | undefined) => {
        if (!val) return 'all';
        const normalized = val.toLowerCase();
        return normalized === 'read' || normalized === 'unread'
          ? normalized
          : 'all';
      }),
      normalizeSearch: jest.fn(
        (val: string | undefined) => val?.trim() || undefined,
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: commentsService,
        },
        {
          provide: CommentsQueryValidator,
          useValue: queryValidator,
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
  });

  it('должен возвращать массив комментариев из сервиса', async () => {
    const serviceResult = {
      items: [{ id: 1 }],
      total: 1,
      hasMore: false,
      readCount: 1,
      unreadCount: 0,
    } as never;
    commentsService.getComments.mockResolvedValue(serviceResult);

    await expect(
      controller.getComments(0, 100, undefined, undefined, undefined),
    ).resolves.toBe(serviceResult);
    expect(commentsService.getComments).toHaveBeenCalledWith({
      offset: 0,
      limit: 100,
      keywords: undefined,
      readStatus: 'all',
      search: undefined,
    });
  });

  it('должен нормализовать отрицательные значения offset и ограничивать limit', async () => {
    const serviceResult = {
      items: [],
      total: 0,
      hasMore: false,
      readCount: 0,
      unreadCount: 0,
    } as never;
    commentsService.getComments.mockResolvedValue(serviceResult);

    queryValidator.normalizeOffset.mockReturnValue(0);
    queryValidator.normalizeLimit.mockReturnValue(200);

    await controller.getComments(-50, 1000, undefined, undefined, undefined);

    expect(queryValidator.normalizeOffset).toHaveBeenCalledWith(-50);
    expect(queryValidator.normalizeLimit).toHaveBeenCalledWith(1000);
    expect(commentsService.getComments).toHaveBeenLastCalledWith({
      offset: 0,
      limit: 200,
      keywords: undefined,
      readStatus: 'all',
      search: undefined,
    });
  });

  it('должен прокидывать параметры фильтрации в сервис', async () => {
    const serviceResult = {
      items: [],
      total: 0,
      hasMore: false,
      readCount: 0,
      unreadCount: 0,
    } as never;
    commentsService.getComments.mockResolvedValue(serviceResult);

    queryValidator.parseKeywords.mockReturnValue(['test', 'demo']);
    queryValidator.normalizeReadStatus.mockReturnValue('unread');
    queryValidator.normalizeSearch.mockReturnValue('keyword');

    await controller.getComments(
      10,
      20,
      [' test ', 'demo'],
      'unread',
      '  keyword  ',
    );

    expect(queryValidator.parseKeywords).toHaveBeenCalledWith([
      ' test ',
      'demo',
    ]);
    expect(queryValidator.normalizeReadStatus).toHaveBeenCalledWith('unread');
    expect(queryValidator.normalizeSearch).toHaveBeenCalledWith('  keyword  ');
    expect(commentsService.getComments).toHaveBeenLastCalledWith({
      offset: 10,
      limit: 20,
      keywords: ['test', 'demo'],
      readStatus: 'unread',
      search: 'keyword',
    });
  });

  it('должен обрабатывать cursor-based пагинацию', async () => {
    const serviceResult = {
      items: [],
      nextCursor: 'next-cursor',
      hasMore: true,
      total: 10,
      readCount: 5,
      unreadCount: 5,
    } as never;
    commentsService.getCommentsCursor.mockResolvedValue(serviceResult);

    queryValidator.normalizeLimitWithDefault.mockReturnValue(50);

    const result = await controller.getCommentsCursor(
      'cursor',
      50,
      undefined,
      undefined,
      undefined,
    );

    expect(result).toBe(serviceResult);
    expect(queryValidator.normalizeLimitWithDefault).toHaveBeenCalledWith(50);
    expect(commentsService.getCommentsCursor).toHaveBeenCalledWith({
      cursor: 'cursor',
      limit: 50,
      keywords: undefined,
      readStatus: 'all',
      search: undefined,
    });
  });

  it('должен обновлять статус прочтения комментария через сервис', async () => {
    const updatedComment = { id: 1, isRead: true } as never;
    commentsService.setReadStatus.mockResolvedValue(updatedComment);

    await expect(
      controller.updateReadStatus(1, { isRead: true }),
    ).resolves.toBe(updatedComment);
    expect(commentsService.setReadStatus).toHaveBeenCalledWith(1, true);
  });
});
