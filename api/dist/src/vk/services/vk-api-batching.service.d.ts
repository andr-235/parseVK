export interface BatchRequest<T> {
    id: string;
    data: T;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
}
export interface BatchOptions {
    maxBatchSize?: number;
    maxWaitMs?: number;
}
export declare class VkApiBatchingService {
    private readonly logger;
    private readonly defaultMaxBatchSize;
    private readonly defaultMaxWaitMs;
    batch<TInput, TOutput>(requests: TInput[], batchFn: (batch: TInput[]) => Promise<TOutput[]>, options?: BatchOptions): Promise<TOutput[]>;
    batchWithMapping<TInput, TOutput, TKey>(requests: Array<{
        key: TKey;
        data: TInput;
    }>, batchFn: (batch: TInput[]) => Promise<TOutput[]>, mapFn: (input: TInput, output: TOutput) => TKey, options?: BatchOptions): Promise<Map<TKey, TOutput>>;
    createBatchQueue<TInput, TOutput>(batchFn: (batch: TInput[]) => Promise<TOutput[]>, options?: BatchOptions): (request: TInput) => Promise<TOutput>;
}
