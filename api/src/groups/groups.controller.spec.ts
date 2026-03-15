import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GroupsController } from './groups.controller.js';
import { GroupsService } from './groups.service.js';

vi.mock('../vk/vk.service', () => ({
  VkService: vi.fn(),
}));

describe('GroupsController', () => {
  let controller: GroupsController;
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

    controller = module.get<GroupsController>(GroupsController);
  });

  it('должен успешно сохранять группу', async () => {
    const group = { id: 1, name: 'Test group' };
    groupsService.saveGroup.mockResolvedValue(group);

    await expect(
      controller.saveGroup({ identifier: 'club1' }),
    ).resolves.toEqual(group);
    expect(groupsService.saveGroup).toHaveBeenCalledWith('club1');
  });

  it('должен пробрасывать NotFoundException при отсутствии группы', async () => {
    groupsService.saveGroup.mockRejectedValue(
      new NotFoundException('Group 123 not found'),
    );

    await expect(controller.saveGroup({ identifier: '123' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('должен успешно загружать группы из файла', async () => {
    const result = {
      success: [],
      failed: [],
      total: 2,
      successCount: 2,
      failedCount: 0,
    };
    groupsService.uploadGroupsFromFile.mockResolvedValue(result);

    const file = {
      buffer: Buffer.from('club1\nclub2', 'utf-8'),
    } as Express.Multer.File;

    await expect(controller.uploadGroups(file)).resolves.toEqual(result);
    expect(groupsService.uploadGroupsFromFile).toHaveBeenCalledWith(
      'club1\nclub2',
    );
  });

  it('должен выбрасывать BadRequestException, если файл не передан', async () => {
    await expect(
      controller.uploadGroups(undefined as unknown as Express.Multer.File),
    ).rejects.toThrow(BadRequestException);
  });

  it('должен возвращать постраничный список групп', async () => {
    const payload = {
      items: [{ id: 1 }, { id: 2 }],
      total: 10,
      page: 1,
      limit: 50,
      hasMore: true,
    };
    groupsService.getAllGroups.mockResolvedValue(payload);

    await expect(controller.getAllGroups({})).resolves.toEqual(payload);
    expect(groupsService.getAllGroups).toHaveBeenCalledWith({
      page: undefined,
      limit: undefined,
    });
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

    await expect(
      controller.getAllGroups({ page: 2, limit: 25 }),
    ).resolves.toEqual(payload);

    expect(groupsService.getAllGroups).toHaveBeenCalledWith({
      page: 2,
      limit: 25,
    });
  });

  it('должен успешно удалять все группы', async () => {
    const response = { count: 2 };
    groupsService.deleteAllGroups.mockResolvedValue(response);

    await expect(controller.deleteAllGroups()).resolves.toEqual(response);
    expect(groupsService.deleteAllGroups).toHaveBeenCalled();
  });

  it('должен успешно удалять конкретную группу', async () => {
    const group = { id: 10 };
    groupsService.deleteGroup.mockResolvedValue(group);

    await expect(controller.deleteGroup({ id: 10 })).resolves.toEqual(group);
    expect(groupsService.deleteGroup).toHaveBeenCalledWith(10);
  });
});
