import type { IGroupResponse } from './group.interface.js';

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
