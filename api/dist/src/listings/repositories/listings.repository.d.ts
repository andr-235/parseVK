import { PrismaService } from '../../prisma.service.js';
import type { GetListingsTransactionResult, IListingsRepository, ListingCreateData, ListingOrderByInput, ListingUpdateData, ListingWhereInput, ListingWhereUniqueInput, ListingsTransactionClient } from '../interfaces/listings-repository.interface.js';
import type { ListingRecord } from '../types/listing-record.type.js';
export declare class ListingsRepository implements IListingsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findMany(params: {
        where?: ListingWhereInput;
        skip?: number;
        take?: number;
        orderBy?: ListingOrderByInput;
        cursor?: ListingWhereUniqueInput;
    }): Promise<ListingRecord[]>;
    count(where?: ListingWhereInput): Promise<number>;
    findUniqueOrThrow(where: {
        id: number;
    }): Promise<ListingRecord>;
    findUniqueByUrl(where: {
        url: string;
    }): Promise<ListingRecord | null>;
    upsert(where: {
        url: string;
    }, create: ListingCreateData, update?: ListingUpdateData): Promise<ListingRecord>;
    update(where: {
        id: number;
    }, data: ListingUpdateData): Promise<ListingRecord>;
    delete(where: {
        id: number;
    }): Promise<ListingRecord>;
    getListingsWithCountAndSources(params: {
        where: ListingWhereInput;
        skip: number;
        take: number;
        orderBy?: ListingOrderByInput;
    }): Promise<GetListingsTransactionResult>;
    transaction<T>(callback: (tx: ListingsTransactionClient) => Promise<T>): Promise<T>;
}
