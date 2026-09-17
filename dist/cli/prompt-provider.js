/**
 * Prompt utilities with injectable provider for tests.
 */
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
export function createDefaultPromptProvider() {
    return {
        async question(message) {
            const rl = createInterface({ input, output });
            const answer = await rl.question(message);
            rl.close();
            return answer;
        },
    };
}
let currentProvider = null;
export function setPromptProvider(provider) {
    currentProvider = provider;
}
export function getPromptProvider() {
    if (currentProvider) {
        return currentProvider;
    }
    const envAnswers = process.env.ZENSTACK_KIT_PROMPT_ANSWERS;
    if (envAnswers) {
        try {
            const parsed = JSON.parse(envAnswers);
            const queue = Array.isArray(parsed) ? [...parsed] : [];
            currentProvider = {
                async question() {
                    return queue.shift() ?? "";
                },
            };
            return currentProvider;
        }
        catch {
            return createDefaultPromptProvider();
        }
    }
    return createDefaultPromptProvider();
}
