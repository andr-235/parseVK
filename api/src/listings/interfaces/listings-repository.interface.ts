import type { Listing, Prisma } from '@prisma/client';

export interface GetListingsTransactionResult {
  listings: Listing[];
  total: number;
  distinctSources: Array<{ source: string | null }>;
}

export interface IListingsRepository {
  findMany(params: {
    where?: Prisma.ListingWhereInput;
    skip?: number;
    take?: number;
    orderBy?:
      | Prisma.ListingOrderByWithRelationInput
      | Prisma.ListingOrderByWithRelationInput[];
    cursor?: Prisma.ListingWhereUniqueInput;
  }): Promise<Listing[]>;
  count(where?: Prisma.ListingWhereInput): Promise<number>;
  findUniqueOrThrow(where: { id: number }): Promise<Listing>;
  findUniqueByUrl(where: { url: string }): Promise<Listing | null>;
  upsert(
    where: { url: string },
    create: Prisma.ListingCreateInput,
    update?: Prisma.ListingUpdateInput,
  ): Promise<Listing>;
  update(
    where: { id: number },
    data: Prisma.ListingUpdateInput,
  ): Promise<Listing>;
  getListingsWithCountAndSources(params: {
    where: Prisma.ListingWhereInput;
    skip: number;
    take: number;
  }): Promise<GetListingsTransactionResult>;
  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T>;
}
