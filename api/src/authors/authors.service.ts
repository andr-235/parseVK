import { Injectable } from '@nestjs/common';
import { Prisma, Author as AuthorModel } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { AuthorCardDto, AuthorsListDto } from './dto/author-card.dto';

const normalizeString = (value: string | null): string | null =>
  value?.trim() ? value.trim() : null;

const isRecord = (value: Prisma.JsonValue): value is Prisma.JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseRecord = (
  value: Prisma.JsonValue | null,
): Prisma.JsonObject | null => {
  if (!value || !isRecord(value)) {
    return null;
  }
  return value;
};

const parseArrayOfRecords = (
  value: Prisma.JsonValue | null,
): Prisma.JsonObject[] | null => {
  if (!value || !Array.isArray(value)) {
    return null;
  }

  const records = value.filter(
    (item): item is Prisma.JsonObject => isRecord(item),
  );

  return records.length ? records : null;
};

const parseStringRecord = (
  value: Prisma.JsonValue | null,
): Record<string, string> | null => {
  const record = parseRecord(value);
  if (!record) {
    return null;
  }

  const entries = Object.entries(record).reduce<Record<string, string>>(
    (acc, [key, rawValue]) => {
      if (typeof rawValue === 'string' && rawValue.trim()) {
        acc[key] = rawValue;
      }
      return acc;
    },
    {},
  );

  return Object.keys(entries).length ? entries : null;
};

const parseNumericRecord = (
  value: Prisma.JsonValue | null,
): Record<string, number | null> | null => {
  const record = parseRecord(value);
  if (!record) {
    return null;
  }

  const entries = Object.entries(record).reduce<
    Record<string, number | null>
  >((acc, [key, rawValue]) => {
    if (typeof rawValue === 'number') {
      acc[key] = rawValue;
    } else if (rawValue === null) {
      acc[key] = null;
    }
    return acc;
  }, {});

  return Object.keys(entries).length ? entries : null;
};

const parseLocation = (
  value: Prisma.JsonValue | null,
): { id?: number; title?: string } | null => {
  const record = parseRecord(value);
  if (!record) {
    return null;
  }

  const id = typeof record.id === 'number' ? record.id : undefined;
  const titleCandidate = record.title ?? record.name;
  const title = typeof titleCandidate === 'string' ? titleCandidate : undefined;

  if (id === undefined && title === undefined) {
    return null;
  }

  return { id, title };
};

const parseLastSeen = (
  value: Prisma.JsonValue | null,
): { time?: number | null; platform?: number | null } | null => {
  const record = parseRecord(value);
  if (!record) {
    return null;
  }

  const time =
    typeof record.time === 'number'
      ? record.time
      : typeof record.time === 'string'
        ? Number.parseInt(record.time, 10)
        : null;
  const platform =
    typeof record.platform === 'number' ? record.platform : null;

  if (time == null && platform == null) {
    return null;
  }

  return { time, platform };
};

@Injectable()
export class AuthorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuthors(options: {
    search?: string;
    offset: number;
    limit: number;
  }): Promise<AuthorsListDto> {
    const { search, offset, limit } = options;
    const where = this.buildSearchFilter(search);

    const [total, authors] = await this.prisma.$transaction([
      this.prisma.author.count({ where }),
      this.prisma.author.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    const items = authors.map((author) => this.mapAuthor(author));

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }

  private buildSearchFilter(
    search?: string,
  ): Prisma.AuthorWhereInput | undefined {
    if (!search) {
      return undefined;
    }

    const normalized = search.trim();
    if (!normalized) {
      return undefined;
    }

    const orConditions: Prisma.AuthorWhereInput[] = [
      { firstName: { contains: normalized, mode: 'insensitive' } },
      { lastName: { contains: normalized, mode: 'insensitive' } },
      { domain: { contains: normalized, mode: 'insensitive' } },
      { screenName: { contains: normalized, mode: 'insensitive' } },
    ];

    const numericId = Number.parseInt(normalized, 10);
    if (!Number.isNaN(numericId)) {
      orConditions.push({ vkUserId: numericId });
    }

    orConditions.push({
      AND: [
        { firstName: { contains: normalized, mode: 'insensitive' } },
        { lastName: { contains: normalized, mode: 'insensitive' } },
      ],
    });

    return { OR: orConditions };
  }

  private mapAuthor(author: AuthorModel): AuthorCardDto {
    const city = parseLocation(author.city);
    const country = parseLocation(author.country);
    const connections = parseStringRecord(author.connections);
    const contacts = parseStringRecord(author.contacts);
    const counters = parseNumericRecord(author.counters);
    const education = parseRecord(author.education);
    const occupation = parseRecord(author.occupation);
    const personal = parseRecord(author.personal);
    const career = parseArrayOfRecords(author.career);
    const military = parseArrayOfRecords(author.military);
    const relatives = parseArrayOfRecords(author.relatives);
    const schools = parseArrayOfRecords(author.schools);
    const universities = parseArrayOfRecords(author.universities);
    const lastSeen = parseLastSeen(author.lastSeen);

    const avatar =
      normalizeString(author.photoMaxOrig) ||
      normalizeString(author.photoMax) ||
      normalizeString(author.photo400Orig) ||
      normalizeString(author.photo200Orig) ||
      normalizeString(author.photo200) ||
      normalizeString(author.photo100) ||
      normalizeString(author.photo50);

    const fullName = `${author.firstName} ${author.lastName}`.trim();
    const profileUrl = author.domain
      ? `https://vk.com/${author.domain}`
      : `https://vk.com/id${author.vkUserId}`;

    return {
      id: author.id,
      createdAt: author.createdAt.toISOString(),
      updatedAt: author.updatedAt.toISOString(),
      profile: {
        id: author.id,
        vkUserId: author.vkUserId,
        firstName: author.firstName,
        lastName: author.lastName,
        fullName,
        deactivated: author.deactivated ?? null,
        isClosed: author.isClosed ?? null,
        domain: author.domain ?? null,
        screenName: author.screenName ?? null,
        avatar: avatar ?? null,
        profileUrl,
      },
      stats: {
        followersCount: author.followersCount ?? null,
        counters,
      },
      details: {
        about: author.about ?? null,
        activities: author.activities ?? null,
        interests: author.interests ?? null,
        music: author.music ?? null,
        movies: author.movies ?? null,
        books: author.books ?? null,
        tv: author.tv ?? null,
        status: author.status ?? null,
        site: normalizeString(author.site ?? null),
        bdate: author.bdate ?? null,
        homeTown: author.homeTown ?? null,
        nickname: author.nickname ?? null,
        maidenName: author.maidenName ?? null,
        relation: author.relation ?? null,
        sex: author.sex ?? null,
        timezone: author.timezone ?? null,
        education,
        occupation,
        personal,
        career,
        military,
        relatives,
        schools,
        universities,
        contacts,
        connections,
        lastSeen,
        city,
        country,
      },
    };
  }
}
