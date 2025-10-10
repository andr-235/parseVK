import { NotFoundException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import type { PrismaService } from '../prisma.service';
import type { VkService } from '../vk/vk.service';
import type {
  IGroupResponse,
  IDeleteResponse,
} from './interfaces/group.interface';
import type { IBulkSaveGroupsResult } from './interfaces/group-bulk.interface';
import type { IGroup } from '../vk/interfaces/group.interfaces';

jest.mock('../vk/vk.service', () => ({
  VkService: jest.fn(),
}));

describe('GroupsService', () => {
  let service: GroupsService;
  let prisma: PrismaService;
  let vkService: VkService;

  const vkGroup = {
    id: 123,
    name: 'Test Group',
    screen_name: 'test_group',
    is_closed: 0,
    deactivated: null,
    type: 'group',
    photo_50: '50.jpg',
    photo_100: '100.jpg',
    photo_200: '200.jpg',
    activity: 'Testing',
    age_limits: 18,
    description: 'Description',
    members_count: 42,
    status: 'Active',
    verified: 1,
    wall: 1,
    addresses: [],
    city: { id: 1, title: 'City' },
    counters: { members: 42 },
  } as unknown as IGroup;

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

  describe('saveGroup', () => {
    it('должен успешно сохранять и маппить данные группы', async () => {
      (vkService.getGroups as jest.Mock).mockResolvedValue({ groups: [vkGroup] });

      const mappedData = {
        name: vkGroup.name,
        screenName: vkGroup.screen_name,
        isClosed: vkGroup.is_closed,
        deactivated: vkGroup.deactivated,
        type: vkGroup.type,
        photo50: vkGroup.photo_50,
        photo100: vkGroup.photo_100,
        photo200: vkGroup.photo_200,
        activity: vkGroup.activity,
        ageLimits: vkGroup.age_limits,
        description: vkGroup.description,
        membersCount: vkGroup.members_count,
        status: vkGroup.status,
        verified: vkGroup.verified,
        wall: vkGroup.wall,
        addresses: vkGroup.addresses,
        city: vkGroup.city,
        counters: vkGroup.counters,
      } satisfies Partial<IGroupResponse>;

      const savedGroup = { id: 1, vkId: vkGroup.id, ...mappedData } as IGroupResponse;
      (prisma.group.upsert as jest.Mock).mockResolvedValue(savedGroup);

      const result = await service.saveGroup('https://vk.com/club123');

      expect(vkService.getGroups).toHaveBeenCalledWith('123');
      expect(prisma.group.upsert).toHaveBeenCalledWith({
        where: { vkId: vkGroup.id },
        update: mappedData,
        create: {
          vkId: vkGroup.id,
          ...mappedData,
        },
      });
      expect(result).toBe(savedGroup);
    });

    it('должен выбрасывать NotFoundException, если группа не найдена', async () => {
      (vkService.getGroups as jest.Mock).mockResolvedValue({ groups: [] });

      await expect(service.saveGroup('123')).rejects.toThrow(
        new NotFoundException('Group 123 not found'),
      );
    });
  });

  it('должен возвращать все группы из базы', async () => {
    const groups = [{ id: 1 }, { id: 2 }] as IGroupResponse[];
    (prisma.group.findMany as jest.Mock).mockResolvedValue(groups);

    const result = await service.getAllGroups();

    expect(prisma.group.findMany).toHaveBeenCalledWith({ orderBy: { updatedAt: 'desc' } });
    expect(result).toBe(groups);
  });

  it('должен удалять группу по идентификатору', async () => {
    const group = { id: 10 } as IGroupResponse;
    (prisma.group.delete as jest.Mock).mockResolvedValue(group);

    const result = await service.deleteGroup(10);

    expect(prisma.group.delete).toHaveBeenCalledWith({ where: { id: 10 } });
    expect(result).toBe(group);
  });

  it('должен удалять все группы', async () => {
    const response = { count: 3 } as unknown as IDeleteResponse;
    (prisma.group.deleteMany as jest.Mock).mockResolvedValue(response);

    const result = await service.deleteAllGroups();

    expect(prisma.group.deleteMany).toHaveBeenCalledWith({});
    expect(result).toBe(response);
  });

  describe('bulkSaveGroups', () => {
    it('должен обрабатывать дубликаты, ошибки VK API и батчи', async () => {
      const identifiers = [
        'club1',
        '1',
        ...Array.from({ length: 10 }, (_, index) => `club${index + 2}`),
        'errorGroup',
      ];

      const setTimeoutSpy = jest
        .spyOn(global, 'setTimeout')
        .mockImplementation((callback: Parameters<typeof setTimeout>[0], timeout?: number) => {
          if (typeof callback === 'function') {
            (callback as (...args: unknown[]) => void)();
          }

          return 0 as ReturnType<typeof setTimeout>;
        });

      const saveGroupMock = jest
        .spyOn(service as unknown as { saveGroup: (id: string | number) => Promise<IGroupResponse> }, 'saveGroup')
        .mockImplementation(async (identifier: string | number) => {
          if (identifier === 'errorGroup') {
            throw new Error('VK error');
          }

          const numberId = Number(identifier);
          const sanitizedId = Number.isNaN(numberId) ? 999 : numberId;

          return {
            id: sanitizedId,
            vkId: sanitizedId,
            name: 'Group',
          } as unknown as IGroupResponse;
        });

      const result = await service.bulkSaveGroups(identifiers);

      expect(saveGroupMock).toHaveBeenCalledTimes(12);
      expect(result.successCount).toBe(11);
      expect(result.failedCount).toBe(2);
      expect(result.total).toBe(identifiers.length);
      expect(result.failed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            identifier: '1',
            errorMessage: 'Дубликат в списке идентификаторов',
          }),
          expect.objectContaining({
            identifier: 'errorGroup',
            errorMessage: 'VK error',
          }),
        ]),
      );
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
      setTimeoutSpy.mockRestore();
      saveGroupMock.mockRestore();
    });
  });

  it('должен читать файл и передавать идентификаторы в bulkSaveGroups', async () => {
    const bulkResult = {
      success: [],
      failed: [],
      total: 2,
      successCount: 2,
      failedCount: 0,
    } satisfies IBulkSaveGroupsResult;

    const bulkSaveSpy = jest
      .spyOn(service as unknown as { bulkSaveGroups: (ids: string[]) => Promise<IBulkSaveGroupsResult> }, 'bulkSaveGroups')
      .mockResolvedValue(bulkResult);

    const result = await service.uploadGroupsFromFile('club1\n\n club2 \n');

    expect(bulkSaveSpy).toHaveBeenCalledWith(['club1', 'club2']);
    expect(result).toBe(bulkResult);
  });

  it('должен корректно нормализовывать различные идентификаторы', () => {
    const normalizeIdentifier = (service as unknown as { normalizeIdentifier: (value: string | number) => string | number })
      .normalizeIdentifier.bind(service);

    expect(normalizeIdentifier('https://vk.com/club123')).toBe('123');
    expect(normalizeIdentifier('https://vk.com/public456')).toBe('456');
    expect(normalizeIdentifier('https://vk.com/screen_name')).toBe('screen_name');
    expect(normalizeIdentifier('club789')).toBe('789');
    expect(normalizeIdentifier('public101')).toBe('101');
    expect(normalizeIdentifier('  screen_name  ')).toBe('screen_name');
    expect(normalizeIdentifier(555)).toBe(555);
  });
});
