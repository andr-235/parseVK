import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/tgmbase/client.js';
import { TgmbasePrismaService } from '../tgmbase-prisma/tgmbase-prisma.service.js';
import { TgmbaseSearchMapper } from './mappers/tgmbase-search.mapper.js';
import type { TgmbaseSearchRequestDto } from './dto/tgmbase-search-request.dto.js';
import type {
  TgmbaseContactDto,
  TgmbaseMessageDto,
  TgmbaseMessagesPageDto,
  TgmbasePeerDto,
  TgmbasePeerType,
  TgmbaseSearchItemDto,
  TgmbaseSearchResponseDto,
  TgmbaseSearchStatus,
  TgmbaseSearchSummaryDto,
} from './dto/tgmbase-search-response.dto.js';
import {
  normalizePhoneNumber,
  normalizeTgmbaseQuery,
  type NormalizedTgmbaseQuery,
} from './utils/normalize-tgmbase-query.util.js';

type SearchUser = Awaited<
  ReturnType<TgmbasePrismaService['user']['findMany']>
>[number];
type SearchMessage = Awaited<
  ReturnType<TgmbasePrismaService['message']['findMany']>
>[number];

@Injectable()
export class TgmbaseSearchService {
  private readonly logger = new Logger(TgmbaseSearchService.name);

  constructor(
    private readonly prisma: TgmbasePrismaService,
    private readonly mapper: TgmbaseSearchMapper,
  ) {}

  async search(
    payload: TgmbaseSearchRequestDto,
  ): Promise<TgmbaseSearchResponseDto> {
    const page = payload.page ?? 1;
    const pageSize = payload.pageSize ?? 20;

    const items = await Promise.all(
      payload.queries.map((query) => this.searchSingle(query, page, pageSize)),
    );

    return {
      summary: this.buildSummary(items),
      items,
    };
  }

  private async searchSingle(
    rawQuery: string,
    page: number,
    pageSize: number,
  ): Promise<TgmbaseSearchItemDto> {
    const normalized = normalizeTgmbaseQuery(rawQuery);

    if (normalized.queryType === 'invalid') {
      return this.createBaseItem(normalized, 'invalid', page, pageSize);
    }

    try {
      const matches = await this.findMatchingUsers(normalized);

      if (matches.length === 0) {
        return this.createBaseItem(normalized, 'not_found', page, pageSize);
      }

      if (matches.length > 1) {
        const item = this.createBaseItem(
          normalized,
          'ambiguous',
          page,
          pageSize,
        );
        item.candidates = matches
          .slice(0, 10)
          .map((user) => this.mapper.toCandidateDto(user));
        return item;
      }

      const profile = matches[0];
      const peers = await this.findPeersForUser(profile.user_id);
      const peerMap = new Map(peers.map((peer) => [peer.peerId, peer]));
      const [contacts, messagesPage] = await Promise.all([
        this.findContacts(profile.user_id, peers),
        this.findMessages(profile.user_id, page, pageSize, peerMap),
      ]);

      return {
        query: rawQuery,
        normalizedQuery: normalized.normalizedValue,
        queryType: normalized.queryType,
        status: 'found',
        profile: this.mapper.toProfileDto(profile),
        candidates: [],
        groups: peers,
        contacts,
        messagesPage,
        stats: {
          groups: peers.length,
          contacts: contacts.length,
          messages: messagesPage.total,
        },
        error: null,
      };
    } catch (error) {
      this.logger.error(`tgmbase search failed for "${rawQuery}"`, error);

      const item = this.createBaseItem(normalized, 'error', page, pageSize);
      item.error = error instanceof Error ? error.message : 'Unknown error';
      return item;
    }
  }

  private async findMatchingUsers(
    normalized: NormalizedTgmbaseQuery,
  ): Promise<SearchUser[]> {
    switch (normalized.queryType) {
      case 'telegramId':
        return this.prisma.user.findMany({
          where: {
            user_id: BigInt(normalized.normalizedValue),
          },
          take: 10,
        });

      case 'username':
        return this.prisma.user.findMany({
          where: {
            username: {
              equals: normalized.normalizedValue,
              mode: 'insensitive',
            },
          },
          orderBy: {
            upd_date: 'desc',
          },
          take: 10,
        });

      case 'phoneNumber': {
        const variants = this.buildPhoneVariants(normalized.normalizedValue);
        return this.prisma.user.findMany({
          where: {
            OR: variants.map((variant) => ({
              phone: variant,
            })),
          },
          orderBy: {
            upd_date: 'desc',
          },
          take: 10,
        });
      }

      case 'invalid':
        return [];
    }
  }

  private buildPhoneVariants(value: string): string[] {
    const digitsOnly = normalizePhoneNumber(value).replace(/^\+/, '');
    const variants = new Set<string>([value, digitsOnly, `+${digitsOnly}`]);

    if (digitsOnly.startsWith('8') && digitsOnly.length === 11) {
      variants.add(`+7${digitsOnly.slice(1)}`);
    }

    if (digitsOnly.startsWith('7') && digitsOnly.length === 11) {
      variants.add(`8${digitsOnly.slice(1)}`);
    }

    return [...variants];
  }

  private async findPeersForUser(userId: bigint): Promise<TgmbasePeerDto[]> {
    const peerRows = await this.prisma.message.groupBy({
      by: ['peer_id'],
      where: {
        from_id: userId,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          peer_id: 'desc',
        },
      },
      take: 50,
    });

    const peerIds = peerRows.map((row) => row.peer_id);
    if (peerIds.length === 0) {
      return [];
    }

    const [groups, supergroups, channels] = await Promise.all([
      this.prisma.group.findMany({
        where: {
          group_id: { in: peerIds },
        },
      }),
      this.prisma.supergroup.findMany({
        where: {
          supergroup_id: { in: peerIds },
        },
      }),
      this.prisma.channel.findMany({
        where: {
          channel_id: { in: peerIds },
        },
      }),
    ]);

    const groupMap = new Map(
      groups.map((group) => [group.group_id.toString(), group] as const),
    );
    const supergroupMap = new Map(
      supergroups.map(
        (group) => [group.supergroup_id.toString(), group] as const,
      ),
    );
    const channelMap = new Map(
      channels.map(
        (channel) => [channel.channel_id.toString(), channel] as const,
      ),
    );

    return peerIds.map((peerId) => {
      const key = peerId.toString();

      if (supergroupMap.has(key)) {
        return this.mapper.toPeerDto(
          peerId,
          'supergroup',
          supergroupMap.get(key),
        );
      }

      if (channelMap.has(key)) {
        return this.mapper.toPeerDto(peerId, 'channel', channelMap.get(key));
      }

      if (groupMap.has(key)) {
        return this.mapper.toPeerDto(peerId, 'group', groupMap.get(key));
      }

      return this.mapper.toPeerDto(peerId, 'unknown');
    });
  }

  private async findContacts(
    userId: bigint,
    peers: TgmbasePeerDto[],
  ): Promise<TgmbaseContactDto[]> {
    const peerIds = peers.map((peer) => BigInt(peer.peerId));
    if (peerIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.$queryRaw<
      Array<{
        user_id: bigint;
        common_peers_count: bigint;
        message_count: bigint;
      }>
    >(Prisma.sql`
      SELECT
        m.from_id AS user_id,
        COUNT(DISTINCT m.peer_id)::bigint AS common_peers_count,
        COUNT(*)::bigint AS message_count
      FROM message m
      WHERE m.peer_id IN (${Prisma.join(peerIds)})
        AND m.from_id IS NOT NULL
        AND m.from_id <> ${userId}
      GROUP BY m.from_id
      ORDER BY COUNT(DISTINCT m.peer_id) DESC, COUNT(*) DESC
      LIMIT 20
    `);

    if (rows.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        user_id: {
          in: rows.map((row) => row.user_id),
        },
      },
    });

    const userMap = new Map(
      users.map((user) => [user.user_id.toString(), user] as const),
    );

    return rows.map((row) => {
      const match = userMap.get(row.user_id.toString());
      const mapped = match ? this.mapper.toProfileDto(match) : null;

      return {
        telegramId: row.user_id.toString(),
        username: mapped?.username ?? null,
        phoneNumber: mapped?.phoneNumber ?? null,
        fullName: mapped?.fullName ?? row.user_id.toString(),
        commonPeersCount: Number(row.common_peers_count),
        messageCount: Number(row.message_count),
      };
    });
  }

  private async findMessages(
    userId: bigint,
    page: number,
    pageSize: number,
    peerMap: Map<string, TgmbasePeerDto>,
  ): Promise<TgmbaseMessagesPageDto> {
    const skip = (page - 1) * pageSize;
    const [total, items] = await Promise.all([
      this.prisma.message.count({
        where: {
          from_id: userId,
        },
      }),
      this.prisma.message.findMany({
        where: {
          from_id: userId,
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map((message) => this.mapper.toMessageDto(message, peerMap)),
      page,
      pageSize,
      total,
      hasMore: skip + items.length < total,
    };
  }

  private createBaseItem(
    normalized: NormalizedTgmbaseQuery,
    status: TgmbaseSearchStatus,
    page: number,
    pageSize: number,
  ): TgmbaseSearchItemDto {
    return {
      query: normalized.rawValue,
      normalizedQuery: normalized.normalizedValue,
      queryType: normalized.queryType,
      status,
      profile: null,
      candidates: [],
      groups: [],
      contacts: [],
      messagesPage: {
        items: [],
        page,
        pageSize,
        total: 0,
        hasMore: false,
      },
      stats: {
        groups: 0,
        contacts: 0,
        messages: 0,
      },
      error: null,
    };
  }

  private buildSummary(items: TgmbaseSearchItemDto[]): TgmbaseSearchSummaryDto {
    return {
      total: items.length,
      found: items.filter((item) => item.status === 'found').length,
      notFound: items.filter((item) => item.status === 'not_found').length,
      ambiguous: items.filter((item) => item.status === 'ambiguous').length,
      invalid: items.filter((item) => item.status === 'invalid').length,
      error: items.filter((item) => item.status === 'error').length,
    };
  }
}
