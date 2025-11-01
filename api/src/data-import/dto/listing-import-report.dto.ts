export interface ListingImportErrorDto {
  index: number;
  url?: string;
  message: string;
}

export interface ListingImportReportDto {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ListingImportErrorDto[];
}
