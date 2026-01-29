/* eslint-disable @typescript-eslint/unbound-method */
import { ParsingQueueService } from './parsing-queue.service.js';
import type { ParsingTaskJobData } from './interfaces/parsing-task-job.interface.js';
import { ParsingQueueProducer } from './queues/parsing.queue.js';
import { ParsingScope } from './dto/create-parsing-task.dto.js';

describe('ParsingQueueService', () => {
  let service: ParsingQueueService;
  let producerMock: jest.Mocked<ParsingQueueProducer>;

  beforeEach(() => {
    producerMock = {
      enqueue: jest
        .fn<Promise<void>, [ParsingTaskJobData]>()
        .mockResolvedValue(undefined),
      remove: jest.fn<Promise<void>, [number]>().mockResolvedValue(undefined),
      getStats: jest
        .fn<
          Promise<{
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
            total: number;
          }>,
          []
        >()
        .mockResolvedValue({
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          total: 0,
        }),
      pause: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
      resume: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
      clear: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ParsingQueueProducer>;

    service = new ParsingQueueService(producerMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('enqueue', () => {
    it('должен добавлять задачу в очередь через producer', async () => {
      const job: ParsingTaskJobData = {
        taskId: 1,
        scope: ParsingScope.ALL,
        groupIds: [],
        postLimit: 10,
      };

      await service.enqueue(job);

      expect(producerMock.enqueue).toHaveBeenCalledWith(job);
      expect(producerMock.enqueue.mock.calls.length).toBe(1);
    });
  });

  describe('remove', () => {
    it('должен удалять задачу из очереди через producer', async () => {
      const taskId = 42;

      await service.remove(taskId);

      const removeMock = producerMock.remove as jest.Mock<
        Promise<void>,
        [number]
      >;
      const removeCalls: Array<[number]> = removeMock.mock.calls;
      expect(removeCalls.length).toBe(1);
      const firstCall = removeCalls[0];
      if (firstCall && firstCall.length > 0) {
        expect(firstCall[0]).toBe(taskId);
      }
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

      (producerMock.getStats as jest.Mock).mockResolvedValue(mockStats);

      const stats = await service.getStats();

      expect(stats).toEqual(mockStats);
      expect(producerMock.getStats.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('pause/resume', () => {
    it('должен приостанавливать очередь', async () => {
      await service.pause();

      expect(producerMock.pause.mock.calls.length).toBe(1);
    });

    it('должен возобновлять очередь', async () => {
      await service.resume();

      expect(producerMock.resume.mock.calls.length).toBe(1);
    });
  });
});
