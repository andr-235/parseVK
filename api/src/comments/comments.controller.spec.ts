import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsService: {
    getCommentsFromRequest: jest.Mock;
    getCommentsCursorFromRequest: jest.Mock;
    setReadStatus: jest.Mock;
  };

  beforeEach(async () => {
    commentsService = {
      getCommentsFromRequest: jest.fn(),
      getCommentsCursorFromRequest: jest.fn(),
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
    commentsService.getCommentsFromRequest.mockResolvedValue(serviceResult);

    await expect(
      controller.getComments(0, 100, undefined, undefined, undefined),
    ).resolves.toBe(serviceResult);
    expect(commentsService.getCommentsFromRequest).toHaveBeenCalledWith(
      0,
      100,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it('должен передавать параметры в сервис без изменений', async () => {
    const serviceResult = {
      items: [],
      total: 0,
      hasMore: false,
      readCount: 0,
      unreadCount: 0,
    } as never;
    commentsService.getCommentsFromRequest.mockResolvedValue(serviceResult);

    await controller.getComments(-50, 1000, undefined, undefined, undefined);

    expect(commentsService.getCommentsFromRequest).toHaveBeenCalledWith(
      -50,
      1000,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it('должен передавать параметры фильтрации в сервис', async () => {
    const serviceResult = {
      items: [],
      total: 0,
      hasMore: false,
      readCount: 0,
      unreadCount: 0,
    } as never;
    commentsService.getCommentsFromRequest.mockResolvedValue(serviceResult);

    await controller.getComments(
      10,
      20,
      [' test ', 'demo'],
      undefined,
      'unread',
      '  keyword  ',
    );

    expect(commentsService.getCommentsFromRequest).toHaveBeenCalledWith(
      10,
      20,
      [' test ', 'demo'],
      undefined,
      'unread',
      '  keyword  ',
    );
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
    commentsService.getCommentsCursorFromRequest.mockResolvedValue(
      serviceResult,
    );

    const result = await controller.getCommentsCursor(
      'cursor',
      50,
      undefined,
      undefined,
      undefined,
    );

    expect(result).toBe(serviceResult);
    expect(commentsService.getCommentsCursorFromRequest).toHaveBeenCalledWith(
      'cursor',
      50,
      undefined,
      undefined,
      undefined,
      undefined,
    );
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
