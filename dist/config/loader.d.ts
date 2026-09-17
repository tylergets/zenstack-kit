/**
 * Configuration loader for zenstack-kit
 */
import type { ZenStackKitConfig } from "./index.js";
export interface LoadedConfig {
    config: ZenStackKitConfig;
    configPath: string;
    configDir: string;
}
export declare function loadConfig(cwd: string, configPath?: string): Promise<LoadedConfig | null>;
//# sourceMappingURL=loader.d.ts.map