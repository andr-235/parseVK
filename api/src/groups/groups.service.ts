import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { VkService } from '../vk/vk.service';
import { IGroup } from '../vk/interfaces/group.interfaces';
import {
  IGroupResponse,
  IDeleteResponse,
  IGroupsListResponse,
} from './interfaces/group.interface';
import {
  IBulkSaveGroupError,
  IBulkSaveGroupsResult,
} from './interfaces/group-bulk.interface';
import {
  IRegionGroupSearchItem,
  IRegionGroupSearchResponse,
} from './interfaces/group-search.interface';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    private prisma: PrismaService,
    private vkService: VkService,
  ) {}

  async saveGroup(identifier: string | number): Promise<IGroupResponse> {
    const parsedIdentifier = this.normalizeIdentifier(identifier);
    const response = await this.vkService.getGroups(parsedIdentifier);

    if (!response?.groups || response.groups.length === 0) {
      this.logger.warn(`Группа ${parsedIdentifier} не найдена`);
      throw new NotFoundException(`Group ${parsedIdentifier} not found`);
    }

    const groupData = response.groups[0] as IGroup;

    const group = await this.prisma.group.upsert({
      where: { vkId: groupData.id },
      update: this.mapGroupData(groupData),
      create: {
        vkId: groupData.id,
        ...this.mapGroupData(groupData),
      },
    });

    this.logger.log(
      `Группа ${groupData.id} сохранена в базе (id записи ${group.id})`,
    );

    return group;
  }

  private mapGroupData(
    groupData: IGroup,
  ): Omit<IGroupResponse, 'id' | 'vkId' | 'createdAt' | 'updatedAt'> {
    return {
      name: groupData.name,
      screenName: groupData.screen_name,
      isClosed: groupData.is_closed,
      deactivated: groupData.deactivated,
      type: groupData.type,
      photo50: groupData.photo_50,
      photo100: groupData.photo_100,
      photo200: groupData.photo_200,
      activity: groupData.activity,
      ageLimits: groupData.age_limits,
      description: groupData.description,
      membersCount: groupData.members_count,
      status: groupData.status,
      verified: groupData.verified,
      wall: groupData.wall,
      addresses: groupData.addresses,
      city: groupData.city,
      counters: groupData.counters,
    };
  }

  async getAllGroups(params?: {
    page?: number;
    limit?: number;
  }): Promise<IGroupsListResponse> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit =
      params?.limit && params.limit > 0 && params.limit <= 200
        ? params.limit
        : 50;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.group.count(),
    ]);

    const hasMore = skip + items.length < total;

    return {
      items,
      total,
      page,
      limit,
      hasMore,
    };
  }

  async deleteGroup(id: number): Promise<IGroupResponse> {
    return this.prisma.group.delete({
      where: { id },
    });
  }

  async deleteAllGroups(): Promise<IDeleteResponse> {
    return this.prisma.group.deleteMany({});
  }

  private parseVkIdentifier(input: string): string {
    // Убираем пробелы
    const trimmed = input.trim();

    // Паттерны для разных форматов
    const patterns = [
      /vk\.com\/club(\d+)/, // https://vk.com/club123456
      /vk\.com\/public(\d+)/, // https://vk.com/public123456
      /vk\.com\/([a-zA-Z0-9_]+)/, // https://vk.com/screen_name
      /^club(\d+)$/, // club123456
      /^public(\d+)$/, // public123456
      /^(\d+)$/, // 123456
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Если ничего не совпало, возвращаем как есть (screen_name)
    return trimmed;
  }

  async bulkSaveGroups(identifiers: string[]): Promise<IBulkSaveGroupsResult> {
    const success: IGroupResponse[] = [];
    const failed: IBulkSaveGroupError[] = [];
    const batchSize = 10; // Обрабатываем по 10 групп за раз

    const seen = new Set<string>();
    const uniqueEntries: Array<{
      originalIdentifier: string;
      parsedIdentifier: string | number;
    }> = [];

    for (const originalIdentifier of identifiers) {
      const parsedIdentifier = this.normalizeIdentifier(originalIdentifier);
      const normalizedKey = String(parsedIdentifier).toLowerCase();

      if (seen.has(normalizedKey)) {
        failed.push({
          identifier: originalIdentifier,
          errorMessage: 'Дубликат в списке идентификаторов',
        });
        continue;
      }

      seen.add(normalizedKey);
      uniqueEntries.push({
        originalIdentifier,
        parsedIdentifier,
      });
    }

    // Обрабатываем батчами
    for (let i = 0; i < uniqueEntries.length; i += batchSize) {
      const batch = uniqueEntries.slice(i, i + batchSize);

      const batchPromises = batch.map(
        async ({ parsedIdentifier, originalIdentifier }) => {
          try {
            const group = await this.saveGroup(parsedIdentifier);
            success.push(group);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            failed.push({
              identifier: originalIdentifier,
              errorMessage,
            });
          }
        },
      );

      // Ждем завершения текущего батча перед следующим (чтобы не перегрузить VK API)
      await Promise.all(batchPromises);

      // Небольшая задержка между батчами для соблюдения rate limit VK API
      if (i + batchSize < uniqueEntries.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    this.logger.log(
      `Загрузка групп завершена: всего ${identifiers.length}, успешно ${success.length}, с ошибками ${failed.length}`,
    );

    return {
      success,
      failed,
      total: identifiers.length,
      successCount: success.length,
      failedCount: failed.length,
    };
  }

  async uploadGroupsFromFile(
    fileContent: string,
  ): Promise<IBulkSaveGroupsResult> {
    const identifiers = fileContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return this.bulkSaveGroups(identifiers);
  }

  private normalizeIdentifier(identifier: string | number): string | number {
    return typeof identifier === 'string'
      ? this.parseVkIdentifier(identifier)
      : identifier;
  }

  async searchRegionGroups(): Promise<IRegionGroupSearchResponse> {
    try {
      this.logger.log(
        'Запуск поиска групп по региону "Еврейская автономная область"',
      );
      const groups = await this.vkService.searchGroupsByRegion({});

      if (!groups.length) {
        this.logger.log('VK API не вернул групп для заданного региона');
        return {
          total: 0,
          groups: [],
          existsInDb: [],
          missing: [],
        };
      }

      const vkIds = groups.map((group) => group.id);
      const existing = await this.prisma.group.findMany({
        where: {
          vkId: {
            in: vkIds,
          },
        },
      });

      const existingIds = new Set(existing.map((group) => group.vkId));

      const items: IRegionGroupSearchItem[] = groups.map((group) => ({
        ...group,
        existsInDb: existingIds.has(group.id),
      }));

      const existsInDb = items.filter((item) => item.existsInDb);
      const missing = items.filter((item) => !item.existsInDb);

      this.logger.log(
        `Поиск завершён: всего в VK ${items.length}, в базе ${existsInDb.length}, уникальных к добавлению ${missing.length}`,
      );

      return {
        total: items.length,
        groups: items,
        existsInDb,
        missing,
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'REGION_NOT_FOUND') {
        this.logger.warn(
          'Попытка поиска по отсутствующему региону "Еврейская автономная область"',
        );
        throw new NotFoundException(
          'Регион "Еврейская автономная область" не найден в VK',
        );
      }

      this.logger.error(
        'Не удалось выполнить поиск групп по региону',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Не удалось выполнить поиск групп по региону',
      );
    }
  }
}
