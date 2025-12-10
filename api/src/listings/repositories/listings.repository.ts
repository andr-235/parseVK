import { Injectable } from '@nestjs/common';
import type { Listing, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type {
  GetListingsTransactionResult,
  IListingsRepository,
} from '../interfaces/listings-repository.interface';

@Injectable()
export class ListingsRepository implements IListingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    where?: Prisma.ListingWhereInput;
    skip?: number;
    take?: number;
    orderBy?: unknown;
    cursor?: Prisma.ListingWhereUniqueInput;
  }): Promise<Listing[]> {
    return this.prisma.listing.findMany(
      params as {
        where?: Prisma.ListingWhereInput;
        skip?: number;
        take?: number;
        orderBy?:
          | Prisma.ListingOrderByWithRelationInput
          | Prisma.ListingOrderByWithRelationInput[];
        cursor?: Prisma.ListingWhereUniqueInput;
      },
    );
  }

  count(where?: Prisma.ListingWhereInput): Promise<number> {
    return this.prisma.listing.count({ where });
  }

  findUniqueOrThrow(where: { id: number }): Promise<Listing> {
    return this.prisma.listing.findUniqueOrThrow({ where });
  }

  findUniqueByUrl(where: { url: string }): Promise<Listing | null> {
    return this.prisma.listing.findUnique({ where });
  }

  upsert(
    where: { url: string },
    create: Prisma.ListingCreateInput,
    update?: Prisma.ListingUpdateInput,
  ): Promise<Listing> {
    return this.prisma.listing.upsert({
      where,
      update: update ?? create,
      create,
    });
  }

  update(
    where: { id: number },
    data: Prisma.ListingUpdateInput,
  ): Promise<Listing> {
    return this.prisma.listing.update({ where, data });
  }

  async getListingsWithCountAndSources(params: {
    where: Prisma.ListingWhereInput;
    skip: number;
    take: number;
  }): Promise<GetListingsTransactionResult> {
    return this.prisma.$transaction(async (tx) => {
      const listings = await tx.listing.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      });
      const total = await tx.listing.count({ where: params.where });
      const distinctSources = await tx.listing.findMany({
        where: { source: { not: null, notIn: [''] } },
        distinct: ['source'],
        select: { source: true },
        orderBy: { source: 'asc' },
      });
      return { listings, total, distinctSources };
    });
  }

  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }
}
