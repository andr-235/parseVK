import { Test, TestingModule } from '@nestjs/testing';
import { CommentsStatsService } from './comments-stats.service';
import {
  COMMENTS_REPOSITORY,
  type ICommentsRepository,
} from '../interfaces/comments-repository.interface';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder';

describe('CommentsStatsService', () => {
  let service: CommentsStatsService;
  let repository: jest.Mocked<ICommentsRepository>;
  let filterBuilder: jest.Mocked<CommentsFilterBuilder>;
  let repositoryObj: {
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
  };
  let filterBuilderObj: {
    buildBaseWhere: jest.Mock;
    buildReadStatusWhere: jest.Mock;
    mergeWhere: jest.Mock;
  };

  beforeEach(async () => {
    repositoryObj = {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      transaction: jest.fn(),
    };
    repository = repositoryObj as never;

    filterBuilderObj = {
      buildBaseWhere: jest.fn(),
      buildReadStatusWhere: jest.fn(),
      mergeWhere: jest.fn(),
    };
    filterBuilder = filterBuilderObj as never;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsStatsService,
        {
          provide: COMMENTS_REPOSITORY,
          useValue: repository,
        },
        {
          provide: CommentsFilterBuilder,
          useValue: filterBuilder,
        },
      ],
    }).compile();

    service = module.get<CommentsStatsService>(CommentsStatsService);
  });

  describe('calculateStats', () => {
    it('должен подсчитывать статистику комментариев', async () => {
      filterBuilderObj.buildBaseWhere.mockReturnValue({ keywords: ['test'] });
      filterBuilderObj.buildReadStatusWhere.mockReturnValue({ isRead: false });
      filterBuilderObj.mergeWhere
        .mockReturnValueOnce({ keywords: ['test'], isRead: false })
        .mockReturnValueOnce({ keywords: ['test'], isRead: true })
        .mockReturnValueOnce({ keywords: ['test'], isRead: false });

      repositoryObj.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(40)
        .mockResolvedValueOnce(60);

      const result = await service.calculateStats(
        { keywords: ['test'] },
        'unread',
      );

      expect(result).toEqual({
        total: 100,
        readCount: 40,
        unreadCount: 60,
      });

      expect(filterBuilderObj.buildBaseWhere).toHaveBeenCalledWith({
        keywords: ['test'],
      });
      expect(filterBuilderObj.buildReadStatusWhere).toHaveBeenCalledWith(
        'unread',
      );
      expect(repositoryObj.count).toHaveBeenCalledTimes(3);
    });

    it('должен использовать все фильтры при подсчете', async () => {
      filterBuilderObj.buildBaseWhere.mockReturnValue({
        keywords: ['test'],
        search: 'query',
      });
      filterBuilderObj.buildReadStatusWhere.mockReturnValue({});
      filterBuilderObj.mergeWhere.mockReturnValue({
        keywords: ['test'],
        search: 'query',
      });

      repositoryObj.count.mockResolvedValue(50);

      await service.calculateStats(
        { keywords: ['test'], search: 'query' },
        'all',
      );

      expect(filterBuilderObj.buildBaseWhere).toHaveBeenCalledWith({
        keywords: ['test'],
        search: 'query',
      });
      expect(filterBuilderObj.buildReadStatusWhere).toHaveBeenCalledWith('all');
    });

    it('должен возвращать нули если комментариев нет', async () => {
      filterBuilderObj.buildBaseWhere.mockReturnValue({});
      filterBuilderObj.buildReadStatusWhere.mockReturnValue({});
      filterBuilderObj.mergeWhere.mockReturnValue({});

      repositoryObj.count.mockResolvedValue(0);

      const result = await service.calculateStats({}, undefined);

      expect(result).toEqual({
        total: 0,
        readCount: 0,
        unreadCount: 0,
      });
    });
  });

  describe('calculateStatsWithAdditionalWhere', () => {
    it('должен подсчитывать статистику с дополнительным where условием', async () => {
      filterBuilderObj.buildBaseWhere.mockReturnValue({ keywords: ['test'] });
      filterBuilderObj.buildReadStatusWhere.mockReturnValue({});
      filterBuilderObj.mergeWhere
        .mockReturnValueOnce({
          keywords: ['test'],
          publishedAt: { lt: new Date() },
        })
        .mockReturnValueOnce({ keywords: ['test'], isRead: true })
        .mockReturnValueOnce({ keywords: ['test'], isRead: false });

      repositoryObj.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5);

      const additionalWhere = { publishedAt: { lt: new Date() } };

      const result = await service.calculateStatsWithAdditionalWhere(
        { keywords: ['test'] },
        'all',
        additionalWhere,
      );

      expect(result).toEqual({
        total: 10,
        readCount: 5,
        unreadCount: 5,
      });

      expect(repositoryObj.count).toHaveBeenCalledTimes(3);
    });
  });
});
