export interface ParsedCounters {
    photos: number | null;
    audios: number | null;
    videos: number | null;
    friends: number | null;
    followers: number | null;
}
export declare class CountersExtractor {
    private readonly counterParser;
    extract(value: unknown): ParsedCounters;
    private getEmptyCounters;
}
