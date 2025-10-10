jest.mock('vk-io', () => ({
  APIError: class MockApiError extends Error {
    code = 0;
  },
}));

import { Logger } from '@nestjs/common';
import { ParsingQueueService } from './parsing-queue.service';
import type { ParsingTaskJobData } from './interfaces/parsing-task-job.interface';

const flushQueue = () => new Promise((resolve) => setImmediate(resolve));

describe('ParsingQueueService', () => {
  let service: ParsingQueueService;
  let runnerMock: { execute: jest.Mock };
  let prismaMock: { task: { update: jest.Mock } };
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    runnerMock = { execute: jest.fn() };
    prismaMock = { task: { update: jest.fn().mockResolvedValue(undefined) } };

    service = new ParsingQueueService(runnerMock as any, prismaMock as any);

    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerErrorSpy.mockRestore();
    loggerWarnSpy.mockRestore();
  });

  it('marks task as running and executes job when enqueued', async () => {
    runnerMock.execute.mockResolvedValue(undefined);

    const job: ParsingTaskJobData = { taskId: 1, scope: 'all' as any, groupIds: [], postLimit: 10 };

    await service.enqueue(job);
    await flushQueue();
    await flushQueue();

    expect(prismaMock.task.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ status: 'running' }),
    });
    expect(runnerMock.execute).toHaveBeenCalledWith(job);
    expect(loggerWarnSpy).not.toHaveBeenCalled();
    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });

  it('marks task as failed and continues with next jobs when execution throws', async () => {
    runnerMock.execute
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(undefined);

    const firstJob: ParsingTaskJobData = { taskId: 10, scope: 'all' as any, groupIds: [], postLimit: 5 };
    const secondJob: ParsingTaskJobData = { taskId: 11, scope: 'all' as any, groupIds: [], postLimit: 5 };

    await service.enqueue(firstJob);
    await service.enqueue(secondJob);
    await flushQueue();
    await flushQueue();
    await flushQueue();

    expect(prismaMock.task.update).toHaveBeenNthCalledWith(1, {
      where: { id: 10 },
      data: expect.objectContaining({ status: 'running' }),
    });
    expect(prismaMock.task.update).toHaveBeenNthCalledWith(2, {
      where: { id: 10 },
      data: expect.objectContaining({ status: 'failed' }),
    });
    expect(prismaMock.task.update).toHaveBeenNthCalledWith(3, {
      where: { id: 11 },
      data: expect.objectContaining({ status: 'running' }),
    });
    expect(runnerMock.execute).toHaveBeenCalledTimes(2);
    expect(runnerMock.execute).toHaveBeenNthCalledWith(1, firstJob);
    expect(runnerMock.execute).toHaveBeenNthCalledWith(2, secondJob);
    expect(loggerErrorSpy).toHaveBeenCalled();
  });
});
