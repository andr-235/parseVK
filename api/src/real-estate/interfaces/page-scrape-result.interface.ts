export interface RawListing {
  externalId: string | null;
  title: string | null;
  url: string | null;
  priceText: string | null;
  address: string | null;
  description: string | null;
  previewImage: string | null;
  publishedAt: string | null;
}

export interface PageScrapeResult {
  listings: RawListing[];
  hasNextPage: boolean;
}