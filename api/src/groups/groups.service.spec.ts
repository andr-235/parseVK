import { NotFoundException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import type { PrismaService } from '../prisma.service';
import type { VkService } from '../vk/vk.service';

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
});
