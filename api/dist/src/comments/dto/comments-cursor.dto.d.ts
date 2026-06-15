export declare class CursorUtils {
    static encode(createdAt: Date, id: number): string;
    static decode(cursor: string): {
        createdAt: Date;
        id: number;
    } | null;
}
