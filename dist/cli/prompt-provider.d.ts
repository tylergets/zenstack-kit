/**
 * Prompt utilities with injectable provider for tests.
 */
export interface PromptProvider {
    question(message: string): Promise<string>;
}
export declare function createDefaultPromptProvider(): PromptProvider;
export declare function setPromptProvider(provider: PromptProvider | null): void;
export declare function getPromptProvider(): PromptProvider;
//# sourceMappingURL=prompt-provider.d.ts.map