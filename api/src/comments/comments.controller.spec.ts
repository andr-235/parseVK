import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsService: { getAllComments: jest.Mock; setReadStatus: jest.Mock };

  beforeEach(async () => {
    commentsService = {
      getAllComments: jest.fn(),
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
    const serviceResult = [{ id: 1 } as never];
    commentsService.getAllComments.mockResolvedValue(serviceResult);

    await expect(controller.getComments()).resolves.toBe(serviceResult);
    expect(commentsService.getAllComments).toHaveBeenCalled();
  });

  it('должен обновлять статус прочтения комментария через сервис', async () => {
    const updatedComment = { id: 1, isRead: true } as never;
    commentsService.setReadStatus.mockResolvedValue(updatedComment);

    await expect(controller.updateReadStatus(1, { isRead: true })).resolves.toBe(updatedComment);
    expect(commentsService.setReadStatus).toHaveBeenCalledWith(1, true);
  });
});
