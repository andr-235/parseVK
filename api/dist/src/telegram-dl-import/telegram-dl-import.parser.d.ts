export interface TelegramDlImportRow {
    sourceRowIndex: number;
    telegramId: string;
    username: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    description: string | null;
    region: string | null;
    date: string | null;
    channels: string | null;
    fullName: string | null;
    address: string | null;
    vkUrl: string | null;
    email: string | null;
    telegramContact: string | null;
    instagram: string | null;
    viber: string | null;
    odnoklassniki: string | null;
    birthDate: string | null;
    usernameExtra: string | null;
    geo: string | null;
}
export interface TelegramDlImportParseResult {
    originalFileName: string;
    replacementKey: string;
    sheetName: string;
    contacts: TelegramDlImportRow[];
}
export declare class TelegramDlImportParser {
    parse(buffer: Buffer, originalFileName: string): Promise<TelegramDlImportParseResult>;
    getReplacementKey(fileName: string): string;
    private readHeaders;
    private toArrayValues;
    private buildHeaderIndex;
    private mapRow;
    private getHeaderPosition;
    private getRequiredHeaderPosition;
    private getHeaderPositions;
    private normalizeHeader;
    private normalizeCell;
    private isEmptyRow;
}
