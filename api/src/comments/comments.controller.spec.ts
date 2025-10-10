import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsService: { getAllComments: jest.Mock };

  beforeEach(async () => {
    commentsService = {
      getAllComments: jest.fn(),
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
});
