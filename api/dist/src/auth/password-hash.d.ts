export interface VerifyAndMaybeRehashResult {
    ok: boolean;
    newHash?: string;
}
export declare function hashSecret(secret: string): Promise<string>;
export declare function verifyAndMaybeRehash(secret: string, storedHash: string): Promise<VerifyAndMaybeRehashResult>;
