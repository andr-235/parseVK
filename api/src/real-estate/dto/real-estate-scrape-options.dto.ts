export interface RealEstateScrapeOptionsDto {
  baseUrl?: string;
  maxPages?: number;
  publishedAfter?: Date;
  requestDelayMs?: number;
  headless?: boolean;
  manual?: boolean;
  manualWaitAfterMs?: number;
}
