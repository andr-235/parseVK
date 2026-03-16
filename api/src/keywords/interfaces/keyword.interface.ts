export interface IKeywordResponse {
  id: number;
  word: string;
  category: string | null;
  isPhrase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeleteResponse {
  success: boolean;
  id?: number;
  count?: number;
}

export interface IBulkAddResponse {
  success: IKeywordResponse[];
  failed: { word: string; error: string }[];
  stats: {
    total: number;
    success: number;
    failed: number;
    created: number;
    updated: number;
  };
}

export interface IKeywordFormsResponse {
  keywordId: number;
  word: string;
  isPhrase: boolean;
  generatedForms: string[];
  manualForms: string[];
  exclusions: string[];
}
