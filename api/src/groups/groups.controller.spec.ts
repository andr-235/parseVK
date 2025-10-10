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

  it('должен сохранять группу через сервис и возвращать результат', async () => {
    const savedGroup = {
      id: 1,
      vkId: 100,
      name: 'Group',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    groupsService.saveGroup.mockResolvedValue(savedGroup);

    await request(app.getHttpServer())
      .post('/groups/save')
      .send({ identifier: 'club100' })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({ id: 1, vkId: 100, name: 'Group' });
      });

    expect(groupsService.saveGroup).toHaveBeenCalledWith('club100');
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

  it('должен возвращать 400, если файл для загрузки не передан', async () => {
    await request(app.getHttpServer())
      .post('/groups/upload')
      .expect(400)
      .expect((response) => {
        expect(response.body.message).toBe('File is required');
      });
  });

  it('должен загружать группы из файла', async () => {
    const bulkResult = {
      success: [],
      failed: [],
      total: 2,
      successCount: 2,
      failedCount: 0,
    };

    groupsService.uploadGroupsFromFile.mockResolvedValue(bulkResult);

    await request(app.getHttpServer())
      .post('/groups/upload')
      .attach('file', Buffer.from('club1\nclub2'), 'groups.txt')
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({ total: 2, successCount: 2 });
      });

    expect(groupsService.uploadGroupsFromFile).toHaveBeenCalledWith(
      'club1\nclub2',
    );
  });

  it('должен возвращать список групп', async () => {
    const groups = [
      { id: 1, vkId: 1, name: 'Group 1' },
      { id: 2, vkId: 2, name: 'Group 2' },
    ];

    groupsService.getAllGroups.mockResolvedValue(groups);

    await request(app.getHttpServer())
      .get('/groups')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: 1, vkId: 1 }),
            expect.objectContaining({ id: 2, vkId: 2 }),
          ]),
        );
      });

    expect(groupsService.getAllGroups).toHaveBeenCalled();
  });

  it('должен удалять все группы', async () => {
    const deleteResult = { count: 5 };
    groupsService.deleteAllGroups.mockResolvedValue(deleteResult);

    await request(app.getHttpServer())
      .delete('/groups/all')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(deleteResult);
      });

    expect(groupsService.deleteAllGroups).toHaveBeenCalled();
  });

  it('должен удалять группу по идентификатору', async () => {
    const group = { id: 1, vkId: 10, name: 'Group 1' };
    groupsService.deleteGroup.mockResolvedValue(group);

    await request(app.getHttpServer())
      .delete('/groups/1')
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({ id: 1, vkId: 10 });
      });

    expect(groupsService.deleteGroup).toHaveBeenCalledWith(1);
  });
});
