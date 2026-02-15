import type { ListingRecord } from '../types/listing-record.type.js';

export type ListingWhereInput = Record<string, unknown>;
type OrderByValue =
  | 'asc'
  | 'desc'
  | { sort: 'asc' | 'desc'; nulls?: 'first' | 'last' };
export type ListingOrderByInput =
  | Record<string, OrderByValue>
  | Array<Record<string, OrderByValue>>;
export type ListingWhereUniqueInput = { id?: number; url?: string };
export type ListingCreateData = Record<string, unknown>;
export type ListingUpdateData = Record<string, unknown>;
export type ListingsTransactionClient = {
  listing: {
    create(params: { data: ListingCreateData }): Promise<ListingRecord>;
  };
};

export interface GetListingsTransactionResult {
  listings: ListingRecord[];
  total: number;
  distinctSources: Array<{ source: string | null }>;
}

export interface IListingsRepository {
  findMany(params: {
    where?: ListingWhereInput;
    skip?: number;
    take?: number;
    orderBy?: ListingOrderByInput;
    cursor?: ListingWhereUniqueInput;
  }): Promise<ListingRecord[]>;
  count(where?: ListingWhereInput): Promise<number>;
  findUniqueOrThrow(where: { id: number }): Promise<ListingRecord>;
  findUniqueByUrl(where: { url: string }): Promise<ListingRecord | null>;
  upsert(
    where: { url: string },
    create: ListingCreateData,
    update?: ListingUpdateData,
  ): Promise<ListingRecord>;
  update(
    where: { id: number },
    data: ListingUpdateData,
  ): Promise<ListingRecord>;
  delete(where: { id: number }): Promise<ListingRecord>;
  getListingsWithCountAndSources(params: {
    where: ListingWhereInput;
    skip: number;
    take: number;
    orderBy?: ListingOrderByInput;
  }): Promise<GetListingsTransactionResult>;
  transaction<T>(
    callback: (tx: ListingsTransactionClient) => Promise<T>,
  ): Promise<T>;
}
