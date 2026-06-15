import type { OkUserInfo } from '../ok-api.service.js';
export declare function flattenUserInfo(user: OkUserInfo): Record<string, string | number | boolean | null>;
export declare function formatCellValue(value: string | number | boolean | null | undefined): string;
