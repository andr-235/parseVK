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
  let groupsService: { saveGroup: jest.Mock };

  beforeEach(async () => {
    groupsService = {
      saveGroup: jest.fn(),
    } as { saveGroup: jest.Mock };

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
});
