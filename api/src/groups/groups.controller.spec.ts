import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

jest.mock('../vk/vk.service', () => ({
  VkService: jest.fn(),
}));

describe('GroupsController (HTTP)', () => {
  let app: INestApplication;
  let groupsService: {
    saveGroup: jest.Mock;
    uploadGroupsFromFile: jest.Mock;
    getAllGroups: jest.Mock;
    deleteAllGroups: jest.Mock;
    deleteGroup: jest.Mock;
  };

  beforeEach(async () => {
    groupsService = {
      saveGroup: jest.fn(),
      uploadGroupsFromFile: jest.fn(),
      getAllGroups: jest.fn(),
      deleteAllGroups: jest.fn(),
      deleteGroup: jest.fn(),
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
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('должен успешно сохранять группу через /groups/save', async () => {
    const group = { id: 1, name: 'Test group' };
    groupsService.saveGroup.mockResolvedValue(group);

    await request(app.getHttpServer())
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

    await request(app.getHttpServer())
      .post('/groups/save')
      .send({ identifier: '123' })
      .expect(404)
      .expect((response) => {
        expect(response.body.message).toBe('Group 123 not found');
      });
  });

  it('должен успешно загружать группы из файла через /groups/upload', async () => {
    const result = { success: [], failed: [], total: 2, successCount: 2, failedCount: 0 };
    groupsService.uploadGroupsFromFile.mockResolvedValue(result);

    await request(app.getHttpServer())
      .post('/groups/upload')
      .attach('file', Buffer.from('club1\nclub2'), 'groups.txt')
      .expect(201)
      .expect(result);

    expect(groupsService.uploadGroupsFromFile).toHaveBeenCalledWith('club1\nclub2');
  });

  it('должен успешно возвращать все группы через GET /groups', async () => {
    const groups = [{ id: 1 }, { id: 2 }];
    groupsService.getAllGroups.mockResolvedValue(groups);

    await request(app.getHttpServer())
      .get('/groups')
      .expect(200)
      .expect(groups);

    expect(groupsService.getAllGroups).toHaveBeenCalled();
  });

  it('должен успешно удалять все группы через DELETE /groups/all', async () => {
    const response = { count: 2 };
    groupsService.deleteAllGroups.mockResolvedValue(response);

    await request(app.getHttpServer())
      .delete('/groups/all')
      .expect(200)
      .expect(response);

    expect(groupsService.deleteAllGroups).toHaveBeenCalled();
  });

  it('должен успешно удалять конкретную группу через DELETE /groups/:id', async () => {
    const group = { id: 10 };
    groupsService.deleteGroup.mockResolvedValue(group);

    await request(app.getHttpServer())
      .delete('/groups/10')
      .expect(200)
      .expect(group);

    expect(groupsService.deleteGroup).toHaveBeenCalledWith(10);
  });
});
