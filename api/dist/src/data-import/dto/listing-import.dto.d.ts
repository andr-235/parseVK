export declare class ListingImportDto {
    url: string;
    source?: string;
    externalId?: string;
    title?: string;
    description?: string;
    price?: string | number | null;
    currency?: string;
    address?: string;
    city?: string;
    latitude?: string | number | null;
    longitude?: string | number | null;
    rooms?: string | number | null;
    areaTotal?: string | number | null;
    areaLiving?: string | number | null;
    areaKitchen?: string | number | null;
    floor?: string | number | null;
    floorsTotal?: string | number | null;
    publishedAt?: string;
    contactName?: string;
    contactPhone?: string;
    images?: string[];
    sourceAuthorName?: string;
    sourceAuthorPhone?: string;
    sourceAuthorUrl?: string;
    sourcePostedAt?: string;
    sourceParsedAt?: string;
    metadata?: Record<string, unknown> | null;
}
