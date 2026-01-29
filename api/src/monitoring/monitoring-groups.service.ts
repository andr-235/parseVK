import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { MonitorDatabaseService } from './monitor-database.service.js';
import type { MonitorGroupDto } from './dto/monitor-group.dto.js';
import type { MonitorGroupsDto } from './dto/monitor-groups.dto.js';
import type { CreateMonitorGroupDto } from './dto/create-monitor-group.dto.js';
import type { UpdateMonitorGroupDto } from './dto/update-monitor-group.dto.js';
import { MonitoringMessenger } from './types/monitoring-messenger.enum.js';

type MonitoringGroupWhereInput = {
  messenger?: MonitoringMessenger;
  category?: {
    equals: string;
    mode: 'insensitive';
  };
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    chatId?: { contains: string; mode: 'insensitive' };
    category?: { contains: string; mode: 'insensitive' };
  }>;
};

type MonitoringGroupFindManyArgs = {
  where?: MonitoringGroupWhereInput;
  orderBy?: { name: 'asc' | 'desc' };
};

type MonitoringGroupCountArgs = {
  where?: MonitoringGroupWhereInput;
};

type MonitoringGroupUpsertArgs = {
  where: {
    messenger_chatId: {
      messenger: MonitoringMessenger;
      chatId: string;
    };
  };
  create: {
    messenger: MonitoringMessenger;
    chatId: string;
    name: string;
    category: string | null;
  };
  update: {
    name: string;
    category?: string | null;
  };
};

type MonitoringGroupUpdateInput = {
  chatId?: string;
  name?: string;
  category?: string | null;
  messenger?: MonitoringMessenger;
};

type MonitoringGroupUpdateArgs = {
  where: { id: number };
  data: MonitoringGroupUpdateInput;
};

type MonitoringGroupDeleteArgs = {
  where: { id: number };
};

type MonitoringGroupRepository = {
  findMany: (args: MonitoringGroupFindManyArgs) => Promise<MonitorGroupDto[]>;
  count: (args: MonitoringGroupCountArgs) => Promise<number>;
  upsert: (args: MonitoringGroupUpsertArgs) => Promise<MonitorGroupDto>;
  update: (args: MonitoringGroupUpdateArgs) => Promise<MonitorGroupDto>;
  delete: (args: MonitoringGroupDeleteArgs) => Promise<MonitorGroupDto>;
};

type MonitoringGroupClient = {
  monitoringGroup: MonitoringGroupRepository;
};

const normalizeRequiredString = (value: string): string => value.trim();

const normalizeOptionalString = (
  value: string | null | undefined,
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeFilter = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

@Injectable()
export class MonitoringGroupsService {
  private readonly logger = new Logger(MonitoringGroupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly monitorDb: MonitorDatabaseService,
  ) {}

  private get monitoringGroup(): MonitoringGroupRepository {
    return (this.prisma as unknown as MonitoringGroupClient).monitoringGroup;
  }

  async getGroups(options?: {
    messenger?: MonitoringMessenger;
    search?: string;
    category?: string;
    sync?: boolean;
  }): Promise<MonitorGroupsDto> {
    if (options?.sync) {
      if (!options.messenger) {
        this.logger.warn('Синхронизация групп пропущена: messenger не указан.');
      } else if (
        options.messenger === MonitoringMessenger.whatsapp ||
        options.messenger === MonitoringMessenger.max
      ) {
        this.logger.log(
          `Запрос синхронизации групп: messenger=${options.messenger}`,
        );
        await this.syncExternalGroups(options.messenger);
      } else {
        this.logger.warn(
          'Синхронизация групп пропущена: messenger не поддерживается.',
        );
      }
    }

    const search = normalizeFilter(options?.search);
    const category = normalizeFilter(options?.category);

    const where: MonitoringGroupWhereInput = {
      ...(options?.messenger ? { messenger: options.messenger } : {}),
      ...(category
        ? {
            category: {
              equals: category,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { chatId: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.monitoringGroup.findMany({
        where,
        orderBy: { name: 'asc' },
      }),
      this.monitoringGroup.count({ where }),
    ]);

    return { items, total };
  }

  createGroup(dto: CreateMonitorGroupDto): Promise<MonitorGroupDto> {
    const chatId = normalizeRequiredString(dto.chatId);
    const name = normalizeRequiredString(dto.name);
    const category = normalizeOptionalString(dto.category) ?? null;

    return this.monitoringGroup.upsert({
      where: {
        messenger_chatId: {
          messenger: dto.messenger,
          chatId,
        },
      },
      create: {
        messenger: dto.messenger,
        chatId,
        name,
        category,
      },
      update: {
        name,
        category,
      },
    });
  }

  updateGroup(
    id: number,
    dto: UpdateMonitorGroupDto,
  ): Promise<MonitorGroupDto> {
    const data: MonitoringGroupUpdateInput = {};

    if (dto.chatId !== undefined) {
      data.chatId = normalizeRequiredString(dto.chatId);
    }

    if (dto.name !== undefined) {
      data.name = normalizeRequiredString(dto.name);
    }

    if (dto.category !== undefined) {
      data.category = normalizeOptionalString(dto.category);
    }

    if (dto.messenger !== undefined) {
      data.messenger = dto.messenger;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Нет данных для обновления группы.');
    }

    return this.monitoringGroup.update({
      where: { id },
      data,
    });
  }

  async deleteGroup(id: number): Promise<{ success: boolean; id: number }> {
    await this.monitoringGroup.delete({ where: { id } });
    return { success: true, id };
  }

  private async syncExternalGroups(
    messenger: MonitoringMessenger,
  ): Promise<void> {
    if (!this.monitorDb.isReady) {
      this.logger.warn(
        `Синхронизация групп пропущена: мониторинг БД не готов (messenger=${messenger}).`,
      );
      return;
    }

    try {
      const sources =
        messenger === MonitoringMessenger.whatsapp
          ? ['messages']
          : messenger === MonitoringMessenger.max
            ? ['messages_max']
            : undefined;
      const sourcesLabel = sources?.join(',') ?? 'auto';
      this.logger.log(
        `Синхронизация групп: messenger=${messenger}, sources=${sourcesLabel}`,
      );

      const groups = await this.monitorDb.findGroups({ sources });
      if (!groups || groups.length === 0) {
        this.logger.warn(
          `Синхронизация групп: внешние группы не найдены (messenger=${messenger}).`,
        );
        return;
      }
      this.logger.log(
        `Синхронизация групп: найдено ${groups.length} записей (messenger=${messenger}).`,
      );

      let synced = 0;
      for (const group of groups) {
        const chatId = normalizeRequiredString(group.chatId);
        const name = normalizeRequiredString(group.name);

        await this.monitoringGroup.upsert({
          where: {
            messenger_chatId: {
              messenger,
              chatId,
            },
          },
          create: {
            messenger,
            chatId,
            name,
            category: null,
          },
          update: {
            name,
          },
        });
        synced += 1;
      }

      this.logger.log(
        `Синхронизация групп завершена: сохранено=${synced} (messenger=${messenger}).`,
      );
    } catch (error) {
      this.logger.warn(
        'Не удалось синхронизировать группы из внешней базы мониторинга.',
      );
      this.logger.debug(error instanceof Error ? error.stack : String(error));
    }
  }
}
