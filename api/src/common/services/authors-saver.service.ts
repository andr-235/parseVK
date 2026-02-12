import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { VkService } from '../../vk/vk.service.js';
import type { IAuthor } from '../../vk/interfaces/author.interfaces.js';
import {
  toUpdateJsonValue,
  toCreateJsonValue,
} from '../utils/prisma-json.utils.js';
import { AUTHORS_REFRESH_BATCH_SIZE } from '../constants/processing.constants.js';

/**
 * Сервис для сохранения и обновления авторов (VK-пользователей) в БД.
 *
 * Единственная ответственность — upsert авторов на основе данных VK API.
 */
@Injectable()
export class AuthorsSaverService {
  private readonly logger = new Logger(AuthorsSaverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vkService: VkService,
  ) {}

  /**
   * Обновляет всех авторов в БД, получая актуальные данные из VK API пачками.
   *
   * @param batchSize - размер пачки для VK API запросов
   * @returns количество обновлённых авторов
   */
  async refreshAllAuthors(
    batchSize = AUTHORS_REFRESH_BATCH_SIZE,
  ): Promise<number> {
    const existingAuthors = await this.prisma.author.findMany({
      select: { vkUserId: true },
      where: { vkUserId: { gt: 0 } },
      orderBy: { vkUserId: 'asc' },
    });

    this.logger.log(
      `[refreshAllAuthors] Найдено авторов для обновления: ${existingAuthors.length}`,
    );

    if (!existingAuthors.length) {
      return 0;
    }

    let totalUpdated = 0;

    for (let index = 0; index < existingAuthors.length; index += batchSize) {
      const chunk: number[] = existingAuthors
        .slice(index, index + batchSize)
        .map((author) => author.vkUserId);

      if (!chunk.length) {
        continue;
      }

      totalUpdated += await this.saveAuthors(chunk);
    }

    this.logger.log(`[refreshAllAuthors] Обновлено авторов: ${totalUpdated}`);
    return totalUpdated;
  }

  /**
   * Получает данные авторов из VK API и делает upsert в БД.
   *
   * @param userIds - массив VK user ID
   * @returns количество сохранённых/обновлённых авторов
   */
  async saveAuthors(userIds: number[]): Promise<number> {
    if (!userIds.length) {
      return 0;
    }

    const uniqueIds = Array.from(new Set(userIds.filter((id) => id > 0)));
    if (!uniqueIds.length) {
      return 0;
    }

    this.logger.debug(
      `[saveAuthors] Запрос VK API для ${uniqueIds.length} авторов`,
    );

    const authors = await this.vkService.getAuthors(uniqueIds);

    for (const author of authors) {
      const updateData = this.buildAuthorUpdateData(author);
      const createData = this.buildAuthorCreateData(author);

      await this.prisma.author.upsert({
        where: { vkUserId: author.id },
        update: updateData,
        create: createData,
      });
    }

    this.logger.debug(`[saveAuthors] Сохранено авторов: ${authors.length}`);
    return authors.length;
  }

  private buildAuthorBaseFields<T>(
    author: IAuthor,
    jsonValueConverter: (value: unknown) => T,
    useNullCoalescing: boolean,
  ) {
    const getValue = <V>(value: V | undefined): V | null => {
      return useNullCoalescing ? (value ?? null) : (value as V);
    };

    return {
      firstName: author.first_name,
      lastName: author.last_name,
      deactivated: getValue(author.deactivated),
      domain: getValue(author.domain),
      screenName: getValue(author.screen_name),
      isClosed: getValue(author.is_closed),
      canAccessClosed: getValue(author.can_access_closed),
      photo50: getValue(author.photo_50),
      photo100: getValue(author.photo_100),
      photo200: getValue(author.photo_200),
      photo200Orig: getValue(author.photo_200_orig),
      photo400Orig: getValue(author.photo_400_orig),
      photoMax: getValue(author.photo_max),
      photoMaxOrig: getValue(author.photo_max_orig),
      photoId: getValue(author.photo_id),
      city: jsonValueConverter(author.city),
      country: jsonValueConverter(author.country),
      about: author.about ?? null,
      activities: author.activities ?? null,
      bdate: author.bdate ?? null,
      books: author.books ?? null,
      career: jsonValueConverter(author.career),
      connections: jsonValueConverter(author.connections),
      contacts: jsonValueConverter(author.contacts),
      counters: jsonValueConverter(author.counters),
      education: jsonValueConverter(author.education),
      followersCount: author.followers_count ?? null,
      homeTown: author.home_town ?? null,
      interests: author.interests ?? null,
      lastSeen: jsonValueConverter(author.last_seen),
      maidenName: author.maiden_name ?? null,
      military: jsonValueConverter(author.military),
      movies: author.movies ?? null,
      music: author.music ?? null,
      nickname: author.nickname ?? null,
      occupation: jsonValueConverter(author.occupation),
      personal: jsonValueConverter(author.personal),
      relatives: jsonValueConverter(author.relatives),
      relation: author.relation ?? null,
      schools: jsonValueConverter(author.schools),
      sex: author.sex ?? null,
      site: author.site ?? null,
      status: author.status ?? null,
      timezone: author.timezone ?? null,
      tv: author.tv ?? null,
      universities: jsonValueConverter(author.universities),
    };
  }

  private buildAuthorUpdateData(author: IAuthor) {
    return this.buildAuthorBaseFields(author, toUpdateJsonValue, false);
  }

  private buildAuthorCreateData(author: IAuthor) {
    return {
      vkUserId: author.id,
      ...this.buildAuthorBaseFields(author, toCreateJsonValue, true),
    };
  }
}
