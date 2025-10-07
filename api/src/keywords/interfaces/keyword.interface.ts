export interface IKeywordResponse {
  id: number;
  word: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeleteResponse {
  count: number;
}

export interface IBulkAddResponse {
  success: IKeywordResponse[];
  failed: { word: string; error: string }[];
  total: number;
  successCount: number;
  failedCount: number;
}
