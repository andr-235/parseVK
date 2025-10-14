import { ParsingQueueService } from './parsing-queue.service';
import type { ParsingTaskJobData } from './interfaces/parsing-task-job.interface';
import { ParsingQueueProducer } from './queues/parsing.queue';

describe('ParsingQueueService', () => {
  let service: ParsingQueueService;
  let producerMock: jest.Mocked<ParsingQueueProducer>;

  beforeEach(() => {
    producerMock = {
      enqueue: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
      }),
      pause: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    } as any;

    service = new ParsingQueueService(producerMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('enqueue', () => {
    it('должен добавлять задачу в очередь через producer', async () => {
      const job: ParsingTaskJobData = {
        taskId: 1,
        scope: 'all' as any,
        groupIds: [],
        postLimit: 10,
      };

      await service.enqueue(job);

      expect(producerMock.enqueue).toHaveBeenCalledWith(job);
      expect(producerMock.enqueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('должен удалять задачу из очереди через producer', async () => {
      const taskId = 42;

      await service.remove(taskId);

      expect(producerMock.remove).toHaveBeenCalledWith(taskId);
      expect(producerMock.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStats', () => {
    it('должен возвращать статистику очереди', async () => {
      const mockStats = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 111,
      };

      producerMock.getStats.mockResolvedValue(mockStats);

      const stats = await service.getStats();

      expect(stats).toEqual(mockStats);
      expect(producerMock.getStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('pause/resume', () => {
    it('должен приостанавливать очередь', async () => {
      await service.pause();

      expect(producerMock.pause).toHaveBeenCalledTimes(1);
    });

    it('должен возобновлять очередь', async () => {
      await service.resume();

      expect(producerMock.resume).toHaveBeenCalledTimes(1);
    });
  });
});
