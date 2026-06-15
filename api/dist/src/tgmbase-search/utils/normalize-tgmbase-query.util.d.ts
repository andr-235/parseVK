export type TgmbaseQueryType = 'telegramId' | 'username' | 'phoneNumber' | 'invalid';
export interface NormalizedTgmbaseQuery {
    rawValue: string;
    normalizedValue: string;
    queryType: TgmbaseQueryType;
}
export declare const normalizePhoneNumber: (value: string) => string;
export declare const normalizeTgmbaseQuery: (rawValue: string) => NormalizedTgmbaseQuery;
