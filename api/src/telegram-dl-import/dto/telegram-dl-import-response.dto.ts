export interface TelegramDlImportBatchDto {
  id: string;
  status: string;
  filesTotal: number;
  filesSuccess: number;
  filesFailed: number;
}

export interface TelegramDlImportFileDto {
  id: string;
  originalFileName: string;
  status: string;
  rowsTotal: number;
  rowsSuccess: number;
  rowsFailed: number;
  isActive: boolean;
  replacedFileId: string | null;
  error: string | null;
}

export interface TelegramDlImportUploadResponseDto {
  batch: TelegramDlImportBatchDto;
  files: TelegramDlImportFileDto[];
}
