export interface RealEstateScrapeOptionsDto {
  baseUrl?: string;
  maxPages?: number;
  publishedAfter?: Date;
  requestDelayMs?: number;
}
