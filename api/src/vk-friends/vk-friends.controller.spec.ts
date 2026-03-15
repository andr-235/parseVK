import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { VkFriendsController } from './vk-friends.controller.js';
import { VkFriendsService } from './vk-friends.service.js';
import { VkFriendsExportJobService } from './services/vk-friends-export-job.service.js';
import { VkFriendsFileService } from './services/vk-friends-file.service.js';
import { FriendsJobStreamService } from '../common/friends-export/services/friends-job-stream.service.js';
import { firstValueFrom, of } from 'rxjs';

describe('VkFriendsController', () => {
  let controller: VkFriendsController;
  let vkFriendsService: {
    createJob: vi.Mock;
    getJobById: vi.Mock;
    getJobLogs: vi.Mock;
  };
  let exportJobService: { run: vi.Mock };
  let fileService: { getExportFilePath: vi.Mock };
  let jobStream: { emit: vi.Mock; getStream: vi.Mock };

  beforeEach(async () => {
    vkFriendsService = {
      createJob: vi.fn(),
      getJobById: vi.fn(),
      getJobLogs: vi.fn(),
    };
    exportJobService = { run: vi.fn().mockResolvedValue(undefined) };
    fileService = { getExportFilePath: vi.fn() };
    jobStream = { emit: vi.fn(), getStream: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VkFriendsController],
      providers: [
        { provide: VkFriendsService, useValue: vkFriendsService },
        { provide: VkFriendsExportJobService, useValue: exportJobService },
        { provide: VkFriendsFileService, useValue: fileService },
        { provide: FriendsJobStreamService, useValue: jobStream },
      ],
    }).compile();

    controller = module.get(VkFriendsController);
  });

  it('export returns job id and enqueues export', async () => {
    const job = {
      id: '11111111-1111-4111-8111-111111111111',
      status: 'RUNNING',
    };
    vkFriendsService.createJob.mockResolvedValue(job);

    await expect(
      controller.export({
        params: { user_id: 42, count: 10 },
      }),
    ).resolves.toEqual({ jobId: job.id, status: job.status });

    expect(vkFriendsService.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'RUNNING',
        vkUserId: 42,
      }),
    );
    expect(jobStream.emit).toHaveBeenCalledWith(job.id, expect.any(Object));
    expect(exportJobService.run).toHaveBeenCalledWith(
      job.id,
      expect.objectContaining({ user_id: 42, count: 10 }),
    );
  });

  it('getJob returns job and logs', async () => {
    const jobId = '11111111-1111-4111-8111-111111111111';
    const job = { id: jobId, status: 'RUNNING' };
    const logs = [{ id: 'log-1' }];
    vkFriendsService.getJobById.mockResolvedValue(job);
    vkFriendsService.getJobLogs.mockResolvedValue(logs);

    await expect(controller.getJob(jobId)).resolves.toEqual({ job, logs });
  });

  it('getJob returns 404 when job missing', async () => {
    const jobId = '11111111-1111-4111-8111-111111111111';
    vkFriendsService.getJobById.mockResolvedValue(null);

    await expect(controller.getJob(jobId)).rejects.toThrow(NotFoundException);
  });

  it('streamJob returns immediate done event for completed job', async () => {
    const jobId = '11111111-1111-4111-8111-111111111111';
    vkFriendsService.getJobById.mockResolvedValue({
      id: jobId,
      status: 'DONE',
      fetchedCount: 1,
      totalCount: 1,
      warning: null,
      xlsxPath: null,
      docxPath: null,
    });
    jobStream.getStream.mockReturnValue(of({ type: 'progress', data: {} }));

    const event = await firstValueFrom(controller.streamJob(jobId));

    expect(event.type).toBe('done');
    expect(event.data).toEqual(
      expect.objectContaining({
        jobId,
        status: 'DONE',
        fetchedCount: 1,
        totalCount: 1,
      }),
    );
  });
});
