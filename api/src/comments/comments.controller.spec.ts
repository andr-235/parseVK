import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsService: {
    getComments: jest.Mock;
    getCommentsCursor: jest.Mock;
    setReadStatus: jest.Mock;
  };

  beforeEach(async () => {
    commentsService = {
      getComments: jest.fn(),
      getCommentsCursor: jest.fn(),
      setReadStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: commentsService,
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

    await controller.getComments(-50, 1000, undefined, undefined, undefined);

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

    await controller.getComments(10, 20, [' test ', 'demo'], 'unread', '  keyword  ');

    expect(commentsService.getComments).toHaveBeenLastCalledWith({
      offset: 10,
      limit: 20,
      keywords: ['test', 'demo'],
      readStatus: 'unread',
      search: 'keyword',
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
