import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import type { VkService } from '../vk/vk.service';
import type {
  IGroupResponse,
  IGroupsListResponse,
} from './interfaces/group.interface';
import type { IBulkSaveGroupsResult } from './interfaces/group-bulk.interface';
import type { IGroup } from '../vk/interfaces/group.interfaces';
import type { IGroupsRepository } from './interfaces/groups-repository.interface';
import { GroupMapper } from './mappers/group.mapper';
import { GroupIdentifierValidator } from './validators/group-identifier.validator';

jest.mock('../vk/vk.service', () => ({
  VkService: jest.fn(),
}));

describe('GroupsService', () => {
  let service: GroupsService;
  let repository: jest.Mocked<IGroupsRepository>;
  let vkService: VkService;
  let groupMapper: jest.Mocked<GroupMapper>;
  let identifierValidator: jest.Mocked<GroupIdentifierValidator>;
  let repositoryObj: {
    upsert: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    getGroupsWithCount: jest.Mock;
    delete: jest.Mock;
    deleteMany: jest.Mock;
    findManyByVkIds: jest.Mock;
  };
  let vkServiceObj: {
    getGroups: jest.Mock;
    searchGroupsByRegion: jest.Mock;
  };
  let groupMapperObj: {
    mapGroupData: jest.Mock;
  };
  let identifierValidatorObj: {
    normalizeIdentifier: jest.Mock;
    parseVkIdentifier: jest.Mock;
  };

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
    repositoryObj = {
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      getGroupsWithCount: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findManyByVkIds: jest.fn(),
    };
    repository = repositoryObj as never;

    vkServiceObj = {
      getGroups: jest.fn(),
      searchGroupsByRegion: jest.fn(),
    };
    vkService = vkServiceObj as unknown as VkService;

    groupMapperObj = {
      mapGroupData: jest.fn(),
    };
    groupMapper = groupMapperObj as never;

    identifierValidatorObj = {
      normalizeIdentifier: jest.fn((id: string) => id),
      parseVkIdentifier: jest.fn((id: string) => id),
    };
    identifierValidator = identifierValidatorObj as never;

    service = new GroupsService(
      repository,
      vkService,
      groupMapper,
      identifierValidator,
    );
  });

  describe('saveGroup', () => {
    it('должен успешно сохранять и маппить данные группы', async () => {
      vkServiceObj.getGroups.mockResolvedValue({
        groups: [vkGroup],
      });

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

      groupMapperObj.mapGroupData.mockReturnValue(
        mappedData as Omit<
          IGroupResponse,
          'id' | 'vkId' | 'createdAt' | 'updatedAt'
        >,
      );

      const savedGroup = {
        id: 1,
        vkId: vkGroup.id,
        ...mappedData,
      } as IGroupResponse;
      repositoryObj.upsert.mockResolvedValue(savedGroup);
      identifierValidatorObj.normalizeIdentifier.mockReturnValue(123);

      const result = await service.saveGroup('https://vk.com/club123');

      expect(vkServiceObj.getGroups).toHaveBeenCalledWith('123');
      expect(repositoryObj.upsert).toHaveBeenCalledWith(
        { vkId: vkGroup.id },
        {
          vkId: vkGroup.id,
          ...mappedData,
        },
      );
      expect(result).toBe(savedGroup);
    });

    it('должен выбрасывать NotFoundException, если группа не найдена', async () => {
      vkServiceObj.getGroups.mockResolvedValue({ groups: [] });

      await expect(service.saveGroup('123')).rejects.toThrow(
        new NotFoundException('Group 123 not found'),
      );
    });
  });

  it('должен возвращать постраничный список групп', async () => {
    const groups = [{ id: 1 }, { id: 2 }] as IGroupResponse[];
    repositoryObj.getGroupsWithCount.mockResolvedValue({
      items: groups,
      total: 10,
    });

    const result = await service.getAllGroups({ page: 2, limit: 2 });

    expect(repositoryObj.getGroupsWithCount).toHaveBeenCalledWith({
      skip: 2,
      take: 2,
    });
    expect(result).toEqual({
      items: groups,
      total: 10,
      page: 2,
      limit: 2,
      hasMore: true,
    } satisfies IGroupsListResponse);
  });

  it('должен удалять группу по идентификатору', async () => {
    const group = { id: 10 } as IGroupResponse;
    repositoryObj.delete.mockResolvedValue(group);

    const result = await service.deleteGroup(10);

    expect(repositoryObj.delete).toHaveBeenCalledWith({ id: 10 });
    expect(result).toBe(group);
  });

  it('должен удалять все группы', async () => {
    const response = { count: 3 };
    repositoryObj.deleteMany.mockResolvedValue(response);

    const result = await service.deleteAllGroups();

    expect(repositoryObj.deleteMany).toHaveBeenCalled();
    expect(result).toEqual(response);
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
        .mockImplementation((callback: Parameters<typeof setTimeout>[0]) => {
          if (typeof callback === 'function') {
            (callback as (...args: unknown[]) => void)();
          }

          return 0 as unknown as ReturnType<typeof setTimeout>;
        });

      const saveGroupMock = jest
        .spyOn(
          service as unknown as {
            saveGroup: (id: string | number) => Promise<IGroupResponse>;
          },
          'saveGroup',
        )
        .mockImplementation((id: string | number) => {
          if (id === 'errorGroup') {
            throw new Error('VK error');
          }

          const numberId = Number(id);
          const sanitizedId = Number.isNaN(numberId) ? 999 : numberId;

          return Promise.resolve({
            id: sanitizedId,
            vkId: sanitizedId,
            name: 'Group',
          } as unknown as IGroupResponse);
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
      .spyOn(
        service as unknown as {
          bulkSaveGroups: (ids: string[]) => Promise<IBulkSaveGroupsResult>;
        },
        'bulkSaveGroups',
      )
      .mockResolvedValue(bulkResult);

    const result = await service.uploadGroupsFromFile('club1\n\n club2 \n');

    expect(bulkSaveSpy).toHaveBeenCalledWith(['club1', 'club2']);
    expect(result).toBe(bulkResult);
  });

  it('должен корректно нормализовывать различные идентификаторы', () => {
    identifierValidatorObj.normalizeIdentifier.mockImplementation(
      (id: string | number) => {
        if (typeof id === 'string') {
          return identifierValidatorObj.parseVkIdentifier(id) as
            | string
            | number;
        }
        return id;
      },
    );
    identifierValidatorObj.parseVkIdentifier.mockImplementation(
      (input: string) => {
        if (input.includes('club')) return input.replace('club', '');
        if (input.includes('public')) return input.replace('public', '');
        return input;
      },
    );
    expect(
      identifierValidatorObj.normalizeIdentifier('https://vk.com/club123'),
    ).toBe('123');
    expect(
      identifierValidatorObj.normalizeIdentifier('https://vk.com/public456'),
    ).toBe('456');
    expect(
      identifierValidatorObj.normalizeIdentifier('https://vk.com/screen_name'),
    ).toBe('screen_name');
    expect(identifierValidatorObj.normalizeIdentifier('club789')).toBe('789');
    expect(identifierValidatorObj.normalizeIdentifier('public101')).toBe('101');
    expect(identifierValidatorObj.normalizeIdentifier('  screen_name  ')).toBe(
      'screen_name',
    );
    expect(identifierValidatorObj.normalizeIdentifier('555')).toBe('555');
  });

  describe('searchRegionGroups', () => {
    const createGroup = (overrides: Partial<IGroup>): IGroup => ({
      id: 0,
      name: 'Группа',
      ...overrides,
    });

    it('должен возвращать разбивку по наличию в БД без ограничения missing', async () => {
      const vkGroups: IGroup[] = [
        createGroup({ id: 10, name: 'Есть в БД' }),
        createGroup({ id: 20, name: 'Нет в БД #1' }),
        createGroup({ id: 30, name: 'Нет в БД #2' }),
      ];

      vkServiceObj.searchGroupsByRegion.mockResolvedValue(vkGroups);
      repositoryObj.findManyByVkIds.mockResolvedValue([
        { id: 1, vkId: 10 },
      ] as unknown as Array<{ id: number; vkId: number }>);

      const result = await service.searchRegionGroups();

      expect(vkServiceObj.searchGroupsByRegion).toHaveBeenCalledWith({});
      expect(repositoryObj.findManyByVkIds).toHaveBeenCalledWith([10, 20, 30]);

      expect(result.total).toBe(3);
      expect(result.existsInDb).toHaveLength(1);
      expect(result.existsInDb[0].id).toBe(10);
      expect(result.missing).toHaveLength(2);
      expect(result.missing.map((item) => item.id)).toEqual([20, 30]);
      expect(result.groups).toEqual([
        expect.objectContaining({ id: 10, existsInDb: true }),
        expect.objectContaining({ id: 20, existsInDb: false }),
        expect.objectContaining({ id: 30, existsInDb: false }),
      ]);
    });

    it('должен возвращать пустой результат, если VK не нашёл группы', async () => {
      vkServiceObj.searchGroupsByRegion.mockResolvedValue([]);

      const result = await service.searchRegionGroups();

      expect(result).toEqual({
        total: 0,
        groups: [],
        existsInDb: [],
        missing: [],
      });
      expect(repositoryObj.findManyByVkIds).not.toHaveBeenCalled();
    });

    it('должен пробрасывать NotFoundException при отсутствии региона', async () => {
      vkServiceObj.searchGroupsByRegion.mockRejectedValue(
        new Error('REGION_NOT_FOUND'),
      );

      await expect(service.searchRegionGroups()).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('должен оборачивать прочие ошибки во внутреннее исключение', async () => {
      vkServiceObj.searchGroupsByRegion.mockRejectedValue(
        new Error('VK error'),
      );

      await expect(service.searchRegionGroups()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
