import { NotFoundException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import type { PrismaService } from '../prisma.service';
import type { VkService } from '../vk/vk.service';
import type { IGroupResponse } from './interfaces/group.interface';

jest.mock('../vk/vk.service', () => ({
  VkService: jest.fn(),
}));

describe('GroupsService', () => {
  let service: GroupsService;
  let prisma: PrismaService;
  let vkService: VkService;

  beforeEach(() => {
    prisma = {
      group: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as unknown as PrismaService;

    vkService = {
      getGroups: jest.fn(),
    } as unknown as VkService;

    service = new GroupsService(prisma, vkService);
  });

  it('должен выбрасывать NotFoundException, если группа не найдена', async () => {
    (vkService.getGroups as jest.Mock).mockResolvedValue({ groups: [] });

    try {
      await service.saveGroup('123');
      fail('Ожидалось исключение NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).message).toBe(
        'Group 123 not found',
      );
    }
  });

  it('должен сохранять найденную группу и возвращать результат', async () => {
    const groupData = {
      id: 42,
      name: 'Test group',
      screen_name: 'test_group',
      is_closed: 0,
      deactivated: null,
      type: 'group',
      photo_50: '50.jpg',
      photo_100: '100.jpg',
      photo_200: '200.jpg',
      activity: 'activity',
      age_limits: 16,
      description: 'desc',
      members_count: 1000,
      status: 'status',
      verified: 1,
      wall: 1,
      addresses: [],
      city: { id: 1 },
      counters: { topics: 1 },
    };

    const expectedMapping = {
      name: 'Test group',
      screenName: 'test_group',
      isClosed: 0,
      deactivated: null,
      type: 'group',
      photo50: '50.jpg',
      photo100: '100.jpg',
      photo200: '200.jpg',
      activity: 'activity',
      ageLimits: 16,
      description: 'desc',
      membersCount: 1000,
      status: 'status',
      verified: 1,
      wall: 1,
      addresses: [],
      city: { id: 1 },
      counters: { topics: 1 },
    };

    const savedGroup = {
      id: 1,
      vkId: 42,
      ...expectedMapping,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
    };

    (vkService.getGroups as jest.Mock).mockResolvedValue({
      groups: [groupData],
    });
    (prisma.group.upsert as jest.Mock).mockResolvedValue(savedGroup);

    const result = await service.saveGroup('https://vk.com/club42');

    expect(vkService.getGroups).toHaveBeenCalledWith('42');
    expect(prisma.group.upsert).toHaveBeenCalledWith({
      where: { vkId: 42 },
      update: expectedMapping,
      create: { vkId: 42, ...expectedMapping },
    });
    expect(result).toEqual(savedGroup);
  });

  it('должен возвращать список всех групп', async () => {
    const groups = [
      {
        id: 1,
        vkId: 10,
        name: 'Group 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.group.findMany as jest.Mock).mockResolvedValue(groups);

    await expect(service.getAllGroups()).resolves.toBe(groups);
    expect(prisma.group.findMany).toHaveBeenCalledWith({
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('должен удалять группу по идентификатору', async () => {
    const group = {
      id: 1,
      vkId: 10,
      name: 'Group 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.group.delete as jest.Mock).mockResolvedValue(group);

    await expect(service.deleteGroup(1)).resolves.toBe(group);
    expect(prisma.group.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('должен удалять все группы', async () => {
    const deleteResult = { count: 3 };
    (prisma.group.deleteMany as jest.Mock).mockResolvedValue(deleteResult);

    await expect(service.deleteAllGroups()).resolves.toBe(deleteResult);
    expect(prisma.group.deleteMany).toHaveBeenCalledWith({});
  });

  it('должен корректно обрабатывать массовое сохранение групп с дубликатами', async () => {
    const now = new Date('2023-01-01T00:00:00Z');
    let callIndex = 0;

    const saveGroupSpy = jest
      .spyOn(service, 'saveGroup')
      .mockImplementation(async (identifier: string | number) => ({
        id: ++callIndex,
        vkId: Number(identifier),
        name: `Group ${identifier}`,
        createdAt: now,
        updatedAt: now,
      }) as unknown as IGroupResponse);

    const result = await service.bulkSaveGroups([
      'https://vk.com/club1',
      'club1',
      'club2',
    ]);

    expect(saveGroupSpy).toHaveBeenCalledTimes(2);
    expect(result.total).toBe(3);
    expect(result.successCount).toBe(2);
    expect(result.failedCount).toBe(1);
    expect(result.failed).toEqual([
      {
        identifier: 'club1',
        errorMessage: 'Дубликат в списке идентификаторов',
      },
    ]);
    expect(result.success).toEqual([
      {
        id: 1,
        vkId: 1,
        name: 'Group 1',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        vkId: 2,
        name: 'Group 2',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    saveGroupSpy.mockRestore();
  });

  it('должен вызывать bulkSaveGroups при загрузке групп из файла', async () => {
    const bulkResult = {
      success: [],
      failed: [],
      total: 0,
      successCount: 0,
      failedCount: 0,
    };

    const bulkSpy = jest
      .spyOn(service, 'bulkSaveGroups')
      .mockResolvedValue(bulkResult);

    await expect(
      service.uploadGroupsFromFile('club1\n\nclub2\n'),
    ).resolves.toBe(bulkResult);

    expect(bulkSpy).toHaveBeenCalledWith(['club1', 'club2']);

    bulkSpy.mockRestore();
  });
});
