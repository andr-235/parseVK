export declare const WORD_CHARS_PATTERN = "[a-zA-Z0-9_\\u0400-\\u04FF]";
export interface KeywordMatchCandidate {
    id: number;
    isPhrase: boolean;
    normalizedWord?: string;
    normalizedForms?: string[];
}
export interface KeywordFormRecord {
    form: string;
}
export interface KeywordCandidateSource {
    id: number;
    word: string;
    isPhrase: boolean;
    keywordForms?: KeywordFormRecord[];
}
export declare function normalizeForKeywordMatch(value: string | null | undefined): string;
export declare function escapeRegExp(value: string): string;
export declare function matchesKeyword(text: string, keyword: KeywordMatchCandidate): boolean;
export declare function buildKeywordMatchCandidate(keyword: KeywordCandidateSource): KeywordMatchCandidate | null;
export declare function buildKeywordMatchCandidates(keywords: KeywordCandidateSource[]): KeywordMatchCandidate[];
