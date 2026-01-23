import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as http from 'http';
import request from 'supertest';
import type { FriendFlatDto } from './dto/vk-friends.dto';
import { VkFriendsController } from './vk-friends.controller';
import { VkFriendsService } from './vk-friends.service';
import { FriendMapper } from './mappers/friend.mapper';
import { VkFriendsExporterService } from './services/vk-friends-exporter.service';
import { VkFriendsJobStreamService } from './services/vk-friends-job-stream.service';
import { firstValueFrom, of } from 'rxjs';

const buildFriend = (
  overrides: Partial<FriendFlatDto> = {},
): FriendFlatDto => ({
  id: null,
  first_name: null,
  last_name: null,
  nickname: null,
  domain: null,
  bdate: null,
  sex: null,
  status: null,
  online: null,
  last_seen_time: null,
  last_seen_platform: null,
  city_id: null,
  city_title: null,
  country_id: null,
  country_title: null,
  has_mobile: null,
  can_post: null,
  can_see_all_posts: null,
  can_write_private_message: null,
  timezone: null,
  photo_50: null,
  photo_100: null,
  photo_200_orig: null,
  photo_id: null,
  relation: null,
  contacts_mobile_phone: null,
  contacts_home_phone: null,
  education_university: null,
  education_faculty: null,
  education_graduation: null,
  universities: null,
  raw_json: null,
  ...overrides,
});

describe('VkFriendsController (HTTP)', () => {
  let app: INestApplication;
  let controller: VkFriendsController;
  let vkFriendsService: {
    fetchAllFriends: jest.Mock;
    createJob: jest.Mock;
    getJobById: jest.Mock;
    getJobLogs: jest.Mock;
  };
  let friendMapper: { mapVkUserToFlatDto: jest.Mock };
  let exporter: { writeXlsxFile: jest.Mock; writeDocxFile: jest.Mock };
  let jobStream: { emit: jest.Mock; getStream: jest.Mock };

  beforeEach(async () => {
    vkFriendsService = {
      fetchAllFriends: jest.fn(),
      createJob: jest.fn(),
      getJobById: jest.fn(),
      getJobLogs: jest.fn(),
    };
    friendMapper = {
      mapVkUserToFlatDto: jest.fn(),
    };
    exporter = {
      writeXlsxFile: jest.fn(),
      writeDocxFile: jest.fn(),
    };
    jobStream = {
      emit: jest.fn(),
      getStream: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VkFriendsController],
      providers: [
        { provide: VkFriendsService, useValue: vkFriendsService },
        { provide: FriendMapper, useValue: friendMapper },
        { provide: VkFriendsExporterService, useValue: exporter },
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

  it('POST /vk/friends/preview respects params.count and maps items', async () => {
    const rawItems = [{ id: 1 }, { id: 2 }];
    vkFriendsService.fetchAllFriends.mockResolvedValue({
      totalCount: 2,
      fetchedCount: 2,
      warning: undefined,
      rawItems,
    });
    friendMapper.mapVkUserToFlatDto.mockImplementation((item, includeRawJson) =>
      buildFriend({
        id: (item as { id: number }).id,
        raw_json: includeRawJson ? '{}' : null,
      }),
    );

    await request(app.getHttpServer() as http.Server)
      .post('/vk/friends/preview')
      .send({
        params: { user_id: 10, count: 2 },
        includeRawJson: false,
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as {
          totalCount?: number;
          warning?: string;
          items?: FriendFlatDto[];
        };
        expect(body.totalCount).toBe(2);
        expect(body.warning).toBeUndefined();
        expect(body.items).toEqual([
          buildFriend({ id: 1, raw_json: null }),
          buildFriend({ id: 2, raw_json: null }),
        ]);
      });

    expect(vkFriendsService.fetchAllFriends).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 10, count: 2 }),
      expect.objectContaining({ includeRawJson: true, pageSize: 2 }),
    );
    expect(friendMapper.mapVkUserToFlatDto).toHaveBeenCalledWith(
      rawItems[0],
      false,
    );
  });

  it('POST /vk/friends/export returns job id and enqueues export', async () => {
    const job = {
      id: '11111111-1111-4111-8111-111111111111',
      status: 'RUNNING',
    };
    vkFriendsService.createJob.mockResolvedValue(job);
    const runExportSpy = jest
      .spyOn(controller as any, 'runExportJob')
      .mockResolvedValue(undefined);

    await request(app.getHttpServer() as http.Server)
      .post('/vk/friends/export')
      .send({
        params: { user_id: 42, count: 10 },
        exportXlsx: true,
        includeRawJson: true,
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
    expect(runExportSpy).toHaveBeenCalledWith(
      job.id,
      expect.objectContaining({ user_id: 42, count: 10 }),
      expect.objectContaining({ exportXlsx: true, exportDocx: false }),
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

  it('GET /vk/friends/jobs/:jobId/download/xlsx blocks when job not done', async () => {
    const jobId = '11111111-1111-4111-8111-111111111111';
    vkFriendsService.getJobById.mockResolvedValue({
      id: jobId,
      status: 'RUNNING',
      xlsxPath: null,
    });

    await request(app.getHttpServer() as http.Server)
      .get(`/vk/friends/jobs/${jobId}/download/xlsx`)
      .expect(400)
      .expect((response) => {
        const body = response.body as { message?: string | string[] };
        const message = Array.isArray(body.message)
          ? body.message.join(' ')
          : (body.message ?? '');
        expect(message).toContain('Export job is not completed');
      });
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
