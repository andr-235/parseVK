import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as http from 'http';
import request from 'supertest';
import { VkFriendsController } from './vk-friends.controller.js';
import { VkFriendsService } from './vk-friends.service.js';
import { VkFriendsExportJobService } from './services/vk-friends-export-job.service.js';
import { VkFriendsFileService } from './services/vk-friends-file.service.js';
import { VkFriendsJobStreamService } from './services/vk-friends-job-stream.service.js';
import { firstValueFrom, of } from 'rxjs';

describe('VkFriendsController (HTTP)', () => {
  let app: INestApplication;
  let controller: VkFriendsController;
  let vkFriendsService: {
    createJob: jest.Mock;
    getJobById: jest.Mock;
    getJobLogs: jest.Mock;
  };
  let exportJobService: { run: jest.Mock };
  let fileService: { getExportFilePath: jest.Mock };
  let jobStream: { emit: jest.Mock; getStream: jest.Mock };

  beforeEach(async () => {
    vkFriendsService = {
      createJob: jest.fn(),
      getJobById: jest.fn(),
      getJobLogs: jest.fn(),
    };
    exportJobService = { run: jest.fn().mockResolvedValue(undefined) };
    fileService = { getExportFilePath: jest.fn() };
    jobStream = { emit: jest.fn(), getStream: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VkFriendsController],
      providers: [
        { provide: VkFriendsService, useValue: vkFriendsService },
        { provide: VkFriendsExportJobService, useValue: exportJobService },
        { provide: VkFriendsFileService, useValue: fileService },
        { provide: VkFriendsJobStreamService, useValue: jobStream },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    controller = module.get(VkFriendsController);
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /vk/friends/export returns job id and enqueues export', async () => {
    const job = {
      id: '11111111-1111-4111-8111-111111111111',
      status: 'RUNNING',
    };
    vkFriendsService.createJob.mockResolvedValue(job);

    await request(app.getHttpServer() as http.Server)
      .post('/vk/friends/export')
      .send({
        params: { user_id: 42, count: 10 },
      })
      .expect(201)
      .expect({ jobId: job.id, status: job.status });

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

  it('GET /vk/friends/jobs/:jobId returns job and logs', async () => {
    const jobId = '11111111-1111-4111-8111-111111111111';
    const job = { id: jobId, status: 'RUNNING' };
    const logs = [{ id: 'log-1' }];
    vkFriendsService.getJobById.mockResolvedValue(job);
    vkFriendsService.getJobLogs.mockResolvedValue(logs);

    await request(app.getHttpServer() as http.Server)
      .get(`/vk/friends/jobs/${jobId}`)
      .expect(200)
      .expect({ job, logs });
  });

  it('GET /vk/friends/jobs/:jobId returns 404 when job missing', async () => {
    const jobId = '11111111-1111-4111-8111-111111111111';
    vkFriendsService.getJobById.mockResolvedValue(null);

    await request(app.getHttpServer() as http.Server)
      .get(`/vk/friends/jobs/${jobId}`)
      .expect(404);
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
