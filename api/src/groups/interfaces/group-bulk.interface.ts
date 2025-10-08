import type { IGroupResponse } from './group.interface';

export interface IBulkSaveGroupError {
  identifier: string;
  errorMessage: string;
}

export interface IBulkSaveGroupsResult {
  success: IGroupResponse[];
  failed: IBulkSaveGroupError[];
  total: number;
  successCount: number;
  failedCount: number;
}
