export declare class ListingValidatorService {
    normalizeUrl(value: string): string;
    isUniqueViolation(error: unknown): boolean;
    mapPrismaError(error: unknown): string;
    private isPrismaKnownError;
}
