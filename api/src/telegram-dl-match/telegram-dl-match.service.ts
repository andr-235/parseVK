import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  DlContact,
  DlMatchResult,
  DlMatchRun,
  Prisma,
  user,
} from '../generated/tgmbase/client.js';
import { TgmbasePrismaService } from '../tgmbase-prisma/tgmbase-prisma.service.js';
import { normalizeTelegramIdentifier } from '../telegram/utils/normalize-telegram-identifier.util.js';
import type {
  TelegramDlMatchResultDto,
  TelegramDlMatchRunDto,
} from './dto/telegram-dl-match-response.dto.js';
import type { TelegramDlMatchResultsQueryDto } from './dto/telegram-dl-match-results-query.dto.js';
import { TelegramDlMatchExporter } from './telegram-dl-match.exporter.js';
import { TelegramDlMatchQueueProducer } from './queues/telegram-dl-match.queue.js';

type DlContactWithImportFile = DlContact & {
  importFile: {
    originalFileName: string;
  };
};

type DlMatchResultCreateManyInput = Parameters<
  TgmbasePrismaService['dlMatchResult']['createMany']
>[0] extends infer T
  ? NonNullable<T> extends { data: infer D }
    ? D extends Array<infer U>
      ? U
      : D extends infer U | Array<infer U>
        ? U
        : never
    : never
  : never;

@Injectable()
export class TelegramDlMatchService {
  private readonly logger = new Logger(TelegramDlMatchService.name);
  private batchSize = 1000;

  constructor(
    private readonly prisma: TgmbasePrismaService,
    private readonly exporter: TelegramDlMatchExporter,
    private readonly queue: TelegramDlMatchQueueProducer,
  ) {}

  async createRun(): Promise<TelegramDlMatchRunDto> {
    const run = await this.prisma.dlMatchRun.create({
      data: {
        status: 'RUNNING',
      },
    });

    try {
      await this.queue.enqueue({ runId: run.id.toString() });

      this.logger.log(
        `Матчинг DL поставлен в очередь: runId=${run.id.toString()}`,
      );

      return this.mapRun(run);
    } catch (error) {
      await this.prisma.dlMatchRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          error:
            error instanceof Error
              ? error.message
              : 'Failed to enqueue dl match run',
        },
      });

      throw error;
    }
  }

  async processRun(runId: string | bigint): Promise<TelegramDlMatchRunDto> {
    const normalizedRunId = typeof runId === 'string' ? BigInt(runId) : runId;

    try {
      const contactsTotal = await this.prisma.dlContact.count();
      let processedContacts = 0;
      let matchesTotal = 0;
      let strictMatchesTotal = 0;
      let usernameMatchesTotal = 0;
      let phoneMatchesTotal = 0;
      let lastContactId: bigint | null = null;
      const runStartedAt = Date.now();

      this.logger.log(
        `Матчинг DL стартовал: runId=${normalizedRunId.toString()} contactsTotal=${contactsTotal} batchSize=${this.batchSize}`,
      );

      while (true) {
        const contacts: DlContactWithImportFile[] =
          await this.prisma.dlContact.findMany({
            take: this.batchSize,
            ...(lastContactId !== null
              ? {
                  skip: 1,
                  cursor: { id: lastContactId },
                }
              : {}),
            include: {
              importFile: true,
            },
            orderBy: [{ id: 'asc' }],
          });

        if (contacts.length === 0) {
          break;
        }

        const batchStartedAt = Date.now();
        const results = await this.buildResults(normalizedRunId, contacts);

        if (results.length > 0) {
          await this.prisma.dlMatchResult.createMany({
            data: results,
          });
        }

        processedContacts += contacts.length;
        matchesTotal += results.length;
        strictMatchesTotal += results.filter(
          (item) => item.strictTelegramIdMatch,
        ).length;
        usernameMatchesTotal += results.filter(
          (item) => item.usernameMatch,
        ).length;
        phoneMatchesTotal += results.filter((item) => item.phoneMatch).length;
        lastContactId = contacts.at(-1)?.id ?? lastContactId;

        await this.prisma.dlMatchRun.update({
          where: { id: normalizedRunId },
          data: {
            status: 'RUNNING',
            contactsTotal: processedContacts,
            matchesTotal,
            strictMatchesTotal,
            usernameMatchesTotal,
            phoneMatchesTotal,
          },
        });

        this.logger.log(
          `Матчинг DL batch: runId=${normalizedRunId.toString()} processed=${processedContacts}/${contactsTotal} batchContacts=${contacts.length} batchMatches=${results.length} totalMatches=${matchesTotal} durationMs=${Date.now() - batchStartedAt} lastContactId=${lastContactId?.toString() ?? '-'}`,
        );
      }

      const finalized = await this.prisma.dlMatchRun.update({
        where: { id: normalizedRunId },
        data: {
          status: 'DONE',
          contactsTotal,
          matchesTotal,
          strictMatchesTotal,
          usernameMatchesTotal,
          phoneMatchesTotal,
          finishedAt: new Date(),
          error: null,
        },
      });

      this.logger.log(
        `Матчинг DL завершен: runId=${normalizedRunId.toString()} contactsTotal=${contactsTotal} matchesTotal=${matchesTotal} durationMs=${Date.now() - runStartedAt}`,
      );

      return {
        ...this.mapRun(finalized),
        contactsTotal,
        matchesTotal,
        strictMatchesTotal,
        usernameMatchesTotal,
        phoneMatchesTotal,
      };
    } catch (error) {
      await this.prisma.dlMatchRun.update({
        where: { id: normalizedRunId },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      this.logger.error(
        `Матчинг DL завершился ошибкой: runId=${normalizedRunId.toString()} error=${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async getRuns(): Promise<TelegramDlMatchRunDto[]> {
    const runs = await this.prisma.dlMatchRun.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });

    return runs.map((run) => this.mapRun(run));
  }

  async getRunById(id: string): Promise<TelegramDlMatchRunDto> {
    const run = await this.prisma.dlMatchRun.findUnique({
      where: { id: BigInt(id) },
    });

    if (!run) {
      throw new NotFoundException(`Run ${id} not found`);
    }

    return this.mapRun(run);
  }

  async getResults(
    runId: string,
    query: TelegramDlMatchResultsQueryDto = {},
  ): Promise<TelegramDlMatchResultDto[]> {
    const items = await this.prisma.dlMatchResult.findMany({
      where: {
        runId: BigInt(runId),
        ...(query.strictOnly === 'true' ? { strictTelegramIdMatch: true } : {}),
        ...(query.usernameOnly === 'true' ? { usernameMatch: true } : {}),
        ...(query.phoneOnly === 'true' ? { phoneMatch: true } : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return items.map((item) => this.mapResult(item));
  }

  async exportRun(runId: string, query: TelegramDlMatchResultsQueryDto) {
    const run = await this.getRunById(runId);
    if (run.status !== 'DONE') {
      throw new BadRequestException('Run is not completed yet');
    }
    const results = await this.getResults(runId, query);
    const buffer = await this.exporter.exportRun(runId, results);

    return {
      buffer,
      fileName: `dl-match-run-${run.id}.xlsx`,
      run,
    };
  }

  private async buildResults(
    runId: bigint,
    contacts: DlContactWithImportFile[],
  ) {
    const strictIds = [
      ...new Set(
        contacts
          .map((contact) => this.normalizeTelegramId(contact.telegramId))
          .filter((value): value is bigint => value !== null),
      ),
    ];
    const usernames = [
      ...new Set(
        contacts
          .map((contact) => contact.username?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const phones = [
      ...new Set(
        contacts
          .map((contact) => contact.phone?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    const [strictMatches, usernameMatches, phoneMatches] = await Promise.all([
      strictIds.length > 0
        ? this.prisma.user.findMany({
            where: { user_id: { in: strictIds } },
          })
        : Promise.resolve<user[]>([]),
      usernames.length > 0
        ? this.prisma.user.findMany({
            where: { username: { in: usernames } },
          })
        : Promise.resolve<user[]>([]),
      phones.length > 0
        ? this.prisma.user.findMany({
            where: { phone: { in: phones } },
          })
        : Promise.resolve<user[]>([]),
    ]);

    const strictMatchesById = new Map<string, user[]>();
    const usernameMatchesByValue = new Map<string, user[]>();
    const phoneMatchesByValue = new Map<string, user[]>();

    strictMatches.forEach((item) => {
      const key = item.user_id.toString();
      strictMatchesById.set(key, [...(strictMatchesById.get(key) ?? []), item]);
    });
    usernameMatches.forEach((item) => {
      if (!item.username) {
        return;
      }

      usernameMatchesByValue.set(item.username, [
        ...(usernameMatchesByValue.get(item.username) ?? []),
        item,
      ]);
    });
    phoneMatches.forEach((item) => {
      if (!item.phone) {
        return;
      }

      phoneMatchesByValue.set(item.phone, [
        ...(phoneMatchesByValue.get(item.phone) ?? []),
        item,
      ]);
    });

    const rows: DlMatchResultCreateManyInput[] = [];

    for (const contact of contacts) {
      const matches = this.findMatches(contact, {
        strictMatchesById,
        usernameMatchesByValue,
        phoneMatchesByValue,
      });
      for (const match of matches) {
        rows.push({
          runId,
          dlContactId: contact.id,
          tgmbaseUserId: match.userId,
          strictTelegramIdMatch: match.strictTelegramIdMatch,
          usernameMatch: match.usernameMatch,
          phoneMatch: match.phoneMatch,
          dlContactSnapshot: this.buildDlContactSnapshot(contact),
          tgmbaseUserSnapshot: match.snapshot,
        });
      }
    }

    return rows;
  }

  private findMatches(
    contact: DlContactWithImportFile,
    lookup: {
      strictMatchesById: Map<string, user[]>;
      usernameMatchesByValue: Map<string, user[]>;
      phoneMatchesByValue: Map<string, user[]>;
    },
  ) {
    const byUserId = this.normalizeTelegramId(contact.telegramId);
    const strictMatches = byUserId
      ? (lookup.strictMatchesById.get(byUserId.toString()) ?? [])
      : [];
    const normalizedUsername = contact.username?.trim() ?? '';
    const usernameMatches = normalizedUsername
      ? (lookup.usernameMatchesByValue.get(normalizedUsername) ?? [])
      : [];
    const normalizedPhone = contact.phone?.trim() ?? '';
    const phoneMatches = normalizedPhone
      ? (lookup.phoneMatchesByValue.get(normalizedPhone) ?? [])
      : [];

    const merged = new Map<
      string,
      {
        userId: bigint;
        strictTelegramIdMatch: boolean;
        usernameMatch: boolean;
        phoneMatch: boolean;
        snapshot: Prisma.InputJsonObject;
      }
    >();

    const upsert = (
      matchedUser: user,
      flags: {
        strictTelegramIdMatch?: boolean;
        usernameMatch?: boolean;
        phoneMatch?: boolean;
      },
    ) => {
      const key = matchedUser.user_id.toString();
      const current = merged.get(key) ?? {
        userId: matchedUser.user_id,
        strictTelegramIdMatch: false,
        usernameMatch: false,
        phoneMatch: false,
        snapshot: this.buildUserSnapshot(matchedUser),
      };

      merged.set(key, {
        ...current,
        strictTelegramIdMatch:
          current.strictTelegramIdMatch || Boolean(flags.strictTelegramIdMatch),
        usernameMatch: current.usernameMatch || Boolean(flags.usernameMatch),
        phoneMatch: current.phoneMatch || Boolean(flags.phoneMatch),
      });
    };

    strictMatches.forEach((item) =>
      upsert(item, { strictTelegramIdMatch: true }),
    );
    usernameMatches.forEach((item) => upsert(item, { usernameMatch: true }));
    phoneMatches.forEach((item) => upsert(item, { phoneMatch: true }));

    return [...merged.values()];
  }

  private normalizeTelegramId(value: string | null | undefined): bigint | null {
    if (!value) {
      return null;
    }

    const normalized = normalizeTelegramIdentifier(value);
    if (
      normalized.kind === 'numericId' ||
      normalized.kind === 'channelNumericId'
    ) {
      return normalized.numericTelegramId ?? null;
    }

    return null;
  }

  private buildDlContactSnapshot(contact: DlContactWithImportFile) {
    const snapshot: Prisma.InputJsonObject = {
      importFileId: contact.importFileId?.toString() ?? null,
      sourceRowIndex: contact.sourceRowIndex,
      telegramId: contact.telegramId,
      username: contact.username,
      phone: contact.phone,
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: contact.fullName,
      region: contact.region,
      originalFileName: contact.importFile.originalFileName,
    };

    return snapshot;
  }

  private buildUserSnapshot(matchedUser: user) {
    const snapshot: Prisma.InputJsonObject = {
      user_id: matchedUser.user_id.toString(),
      username: matchedUser.username,
      phone: matchedUser.phone,
      first_name: matchedUser.first_name,
      last_name: matchedUser.last_name,
      premium: matchedUser.premium,
      scam: matchedUser.scam,
      bot: matchedUser.bot,
      upd_date: matchedUser.upd_date?.toISOString() ?? null,
    };

    return snapshot;
  }

  private mapRun(run: DlMatchRun): TelegramDlMatchRunDto {
    return {
      id: run.id.toString(),
      status: run.status,
      contactsTotal: run.contactsTotal,
      matchesTotal: run.matchesTotal,
      strictMatchesTotal: run.strictMatchesTotal,
      usernameMatchesTotal: run.usernameMatchesTotal,
      phoneMatchesTotal: run.phoneMatchesTotal,
      createdAt: run.createdAt?.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
      error: run.error ?? null,
    };
  }

  private mapResult(item: DlMatchResult): TelegramDlMatchResultDto {
    const dlSnapshot =
      (item.dlContactSnapshot as Record<string, unknown> | null) ?? {};
    const userSnapshot =
      (item.tgmbaseUserSnapshot as Record<string, unknown> | null) ?? null;

    return {
      id: item.id.toString(),
      runId: item.runId.toString(),
      dlContactId: item.dlContactId.toString(),
      tgmbaseUserId: item.tgmbaseUserId?.toString() ?? null,
      strictTelegramIdMatch: item.strictTelegramIdMatch,
      usernameMatch: item.usernameMatch,
      phoneMatch: item.phoneMatch,
      dlContact: {
        id: item.dlContactId.toString(),
        importFileId: dlSnapshot.importFileId ?? null,
        originalFileName: dlSnapshot.originalFileName ?? null,
        telegramId: dlSnapshot.telegramId ?? null,
        username: dlSnapshot.username ?? null,
        phone: dlSnapshot.phone ?? null,
        firstName: dlSnapshot.firstName ?? null,
        lastName: dlSnapshot.lastName ?? null,
        fullName: dlSnapshot.fullName ?? null,
        region: dlSnapshot.region ?? null,
        sourceRowIndex: dlSnapshot.sourceRowIndex ?? null,
      },
      user:
        userSnapshot === null
          ? null
          : {
              id: item.tgmbaseUserId?.toString() ?? null,
              ...userSnapshot,
            },
      createdAt: item.createdAt.toISOString(),
    };
  }
}
