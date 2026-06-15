export declare class CounterValueParser {
    parse(value: unknown, depth?: number): number | null;
    private parseStringValue;
    private parseArrayValue;
    private parseObjectValue;
}
