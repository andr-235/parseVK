export declare class KeywordMorphologyService {
    private static initPromise;
    generateForms(word: string, isPhrase?: boolean): Promise<string[]>;
    private ensureInitialized;
}
