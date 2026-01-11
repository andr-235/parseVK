import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type {
  GetListingsTransactionResult,
  IListingsRepository,
  ListingCreateData,
  ListingOrderByInput,
  ListingUpdateData,
  ListingWhereInput,
  ListingWhereUniqueInput,
  ListingsTransactionClient,
} from '../interfaces/listings-repository.interface';
import type { ListingRecord } from '../types/listing-record.type';

@Injectable()
export class ListingsRepository implements IListingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    where?: ListingWhereInput;
    skip?: number;
    take?: number;
    orderBy?: ListingOrderByInput;
    cursor?: ListingWhereUniqueInput;
  }): Promise<ListingRecord[]> {
    return this.prisma.listing.findMany({
      where: params.where as Prisma.ListingWhereInput,
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy as Prisma.ListingOrderByWithRelationInput,
      cursor: params.cursor as Prisma.ListingWhereUniqueInput,
    });
  }

  count(where?: ListingWhereInput): Promise<number> {
    return this.prisma.listing.count({
      where: where as Prisma.ListingWhereInput,
    });
  }

  findUniqueOrThrow(where: { id: number }): Promise<ListingRecord> {
    return this.prisma.listing.findUniqueOrThrow({ where });
  }

  findUniqueByUrl(where: { url: string }): Promise<ListingRecord | null> {
    return this.prisma.listing.findUnique({ where });
  }

  upsert(
    where: { url: string },
    create: ListingCreateData,
    update?: ListingUpdateData,
  ): Promise<ListingRecord> {
    return this.prisma.listing.upsert({
      where,
      update: (update ?? create) as Prisma.ListingUpdateInput,
      create: create as Prisma.ListingCreateInput,
    });
  }

  update(
    where: { id: number },
    data: ListingUpdateData,
  ): Promise<ListingRecord> {
    return this.prisma.listing.update({
      where,
      data: data as Prisma.ListingUpdateInput,
    });
  }

  async getListingsWithCountAndSources(params: {
    where: ListingWhereInput;
    skip: number;
    take: number;
  }): Promise<GetListingsTransactionResult> {
    return this.prisma.$transaction(async (tx) => {
      const listings = await tx.listing.findMany({
        where: params.where as Prisma.ListingWhereInput,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      });
      const total = await tx.listing.count({
        where: params.where as Prisma.ListingWhereInput,
      });
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
    callback: (tx: ListingsTransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) =>
      callback(tx as unknown as ListingsTransactionClient),
    );
  }
}
