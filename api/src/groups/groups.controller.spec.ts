import { vi } from 'vitest';
import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as http from 'http';
import request from 'supertest';
import { GroupsController } from './groups.controller.js';
import { GroupsService } from './groups.service.js';

vi.mock('../vk/vk.service', () => ({
  VkService: vi.fn(),
}));

describe('GroupsController (HTTP)', () => {
  let app: INestApplication;
  let groupsService: {
    saveGroup: vi.Mock;
    uploadGroupsFromFile: vi.Mock;
    getAllGroups: vi.Mock;
    deleteAllGroups: vi.Mock;
    deleteGroup: vi.Mock;
  };

  beforeEach(async () => {
    groupsService = {
      saveGroup: vi.fn(),
      uploadGroupsFromFile: vi.fn(),
      getAllGroups: vi.fn(),
      deleteAllGroups: vi.fn(),
      deleteGroup: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: groupsService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('должен успешно сохранять группу через /groups/save', async () => {
    const group = { id: 1, name: 'Test group' };
    groupsService.saveGroup.mockResolvedValue(group);

    await request(app.getHttpServer() as http.Server)
      .post('/groups/save')
      .send({ identifier: 'club1' })
      .expect(201)
      .expect(group);

    expect(groupsService.saveGroup).toHaveBeenCalledWith('club1');
  });

  it('должен возвращать 404, если сервис сообщает об отсутствии группы', async () => {
    groupsService.saveGroup.mockRejectedValue(
      new NotFoundException('Group 123 not found'),
    );

    await request(app.getHttpServer() as http.Server)
      .post('/groups/save')
      .send({ identifier: '123' })
      .expect(404)
      .expect((response: request.Response) => {
        expect((response.body as { message?: string }).message).toBe(
          'Group 123 not found',
        );
      });
  });

  it('должен успешно загружать группы из файла через /groups/upload', async () => {
    const result = {
      success: [],
      failed: [],
      total: 2,
      successCount: 2,
      failedCount: 0,
    };
    groupsService.uploadGroupsFromFile.mockResolvedValue(result);

    await request(app.getHttpServer() as http.Server)
      .post('/groups/upload')
      .attach('file', Buffer.from('club1\nclub2'), 'groups.txt')
      .expect(201)
      .expect(result);

    expect(groupsService.uploadGroupsFromFile).toHaveBeenCalledWith(
      'club1\nclub2',
    );
  });

  it('должен возвращать постраничный список групп через GET /groups', async () => {
    const payload = {
      items: [{ id: 1 }, { id: 2 }],
      total: 10,
      page: 1,
      limit: 50,
      hasMore: true,
    };
    groupsService.getAllGroups.mockResolvedValue(payload);

    await request(app.getHttpServer() as http.Server)
      .get('/groups')
      .expect(200)
      .expect(payload);

    expect(groupsService.getAllGroups).toHaveBeenCalledWith({});
  });

  it('должен прокидывать параметры пагинации из query', async () => {
    const payload = {
      items: [],
      total: 0,
      page: 2,
      limit: 25,
      hasMore: false,
    };
    groupsService.getAllGroups.mockResolvedValue(payload);

    await request(app.getHttpServer() as http.Server)
      .get('/groups')
      .query({ page: '2', limit: '25' })
      .expect(200)
      .expect(payload);

    expect(groupsService.getAllGroups).toHaveBeenCalledWith({
      page: 2,
      limit: 25,
    });
  });

  it('должен успешно удалять все группы через DELETE /groups/all', async () => {
    const response = { count: 2 };
    groupsService.deleteAllGroups.mockResolvedValue(response);

    await request(app.getHttpServer() as http.Server)
      .delete('/groups/all')
      .expect(200)
      .expect(response);

    expect(groupsService.deleteAllGroups).toHaveBeenCalled();
  });

  it('должен успешно удалять конкретную группу через DELETE /groups/:id', async () => {
    const group = { id: 10 };
    groupsService.deleteGroup.mockResolvedValue(group);

    await request(app.getHttpServer() as http.Server)
      .delete('/groups/10')
      .expect(200)
      .expect(group);

    expect(groupsService.deleteGroup).toHaveBeenCalledWith(10);
  });
});
