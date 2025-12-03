import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
import type { IGroupsRepository } from './interfaces/groups-repository.interface';
import { GroupMapper } from './mappers/group.mapper';
import { GroupIdentifierValidator } from './validators/group-identifier.validator';

/**
 * Сервис для управления VK группами
 *
 * Обеспечивает сохранение, поиск и массовую загрузку групп из VK API.
 */
@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    @Inject('IGroupsRepository')
    private readonly repository: IGroupsRepository,
    private readonly vkService: VkService,
    private readonly groupMapper: GroupMapper,
    private readonly identifierValidator: GroupIdentifierValidator,
  ) {}

  /**
   * Сохраняет группу из VK API в базу данных
   *
   * @param identifier - Идентификатор группы (screen_name, vkId или короткое имя)
   * @returns Сохраненная группа
   * @throws NotFoundException если группа не найдена в VK
   */
  async saveGroup(identifier: string | number): Promise<IGroupResponse> {
    const parsedIdentifier =
      this.identifierValidator.normalizeIdentifier(identifier);
    const response = await this.vkService.getGroups(parsedIdentifier);

    if (!response?.groups || response.groups.length === 0) {
      this.logger.warn(`Группа ${parsedIdentifier} не найдена`);
      throw new NotFoundException(`Group ${parsedIdentifier} not found`);
    }

    const groupData = response.groups[0] as IGroup;

    const mappedData = this.groupMapper.mapGroupData(groupData);
    const group = await this.repository.upsert(
      { vkId: groupData.id },
      {
        vkId: groupData.id,
        ...mappedData,
      },
    );

    this.logger.log(
      `Группа ${groupData.id} сохранена в базе (id записи ${group.id})`,
    );

    return group;
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

    const { items, total } = await this.repository.getGroupsWithCount({
      skip,
      take: limit,
    });

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
    return this.repository.delete({ id });
  }

  async deleteAllGroups(): Promise<IDeleteResponse> {
    return this.repository.deleteMany();
  }

  async bulkSaveGroups(identifiers: string[]): Promise<IBulkSaveGroupsResult> {
    const success: IGroupResponse[] = [];
    const failed: IBulkSaveGroupError[] = [];
    const batchSize = 10;

    const seen = new Set<string>();
    const uniqueEntries: Array<{
      originalIdentifier: string;
      parsedIdentifier: string | number;
    }> = [];

    for (const originalIdentifier of identifiers) {
      const parsedIdentifier =
        this.identifierValidator.normalizeIdentifier(originalIdentifier);
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

      await Promise.all(batchPromises);

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
      const existing = await this.repository.findManyByVkIds(vkIds);

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
