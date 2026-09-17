/**
 * Command implementations for zenstack-kit CLI
 *
 * These functions contain the core logic and can be tested independently
 * from the CLI/UI layer.
 */
import type { RenameChoice, MigrationConfirmChoice } from "./prompts.js";
import type { ZenStackKitConfig } from "../config/index.js";
export type LogFn = (type: "info" | "success" | "error" | "warning", message: string) => void;
export interface CommandOptions {
    schema?: string;
    migrations?: string;
    name?: string;
    migration?: string;
    noUi?: boolean;
    dialect?: string;
    url?: string;
    output?: string;
    table?: string;
    dbSchema?: string;
    baseline?: boolean;
    createInitial?: boolean;
    preview?: boolean;
    markApplied?: boolean;
    force?: boolean;
    config?: string;
    empty?: boolean;
    updateSnapshot?: boolean;
    strict?: boolean;
    ignoreOrderMismatch?: boolean;
}
export interface CommandContext {
    cwd: string;
    options: CommandOptions;
    log: LogFn;
    promptSnapshotExists?: () => Promise<"skip" | "reinitialize">;
    promptFreshInit?: () => Promise<"baseline" | "create_initial">;
    promptPullConfirm?: (existingFiles: string[]) => Promise<boolean>;
    promptTableRename?: (from: string, to: string) => Promise<RenameChoice>;
    promptColumnRename?: (table: string, from: string, to: string) => Promise<RenameChoice>;
    promptMigrationName?: (defaultName: string) => Promise<string>;
    promptMigrationConfirm?: (migrationPath: string) => Promise<MigrationConfirmChoice>;
}
export declare class CommandError extends Error {
    constructor(message: string);
}
/**
 * Load and validate config, returning resolved paths
 */
export declare function resolveConfig(ctx: CommandContext): Promise<{
    config: ZenStackKitConfig;
    configDir: string;
    schemaPath: string;
    outputPath: string;
    dialect: "sqlite" | "postgres" | "mysql";
}>;
/**
 * Validate that the schema file exists (schemaPath should be absolute)
 */
export declare function validateSchemaExists(schemaPath: string): void;
/**
 * Get connection URL from config based on dialect
 */
export declare function getConnectionUrl(config: ZenStackKitConfig, dialect: "sqlite" | "postgres" | "mysql"): string | undefined;
/**
 * migrate:generate command
 */
export declare function runMigrateGenerate(ctx: CommandContext): Promise<void>;
/**
 * migrate:apply command
 */
export declare function runMigrateApply(ctx: CommandContext): Promise<void>;
/**
 * migrate:rehash command
 */
export declare function runMigrateRehash(ctx: CommandContext): Promise<void>;
/**
 * init command
 */
export declare function runInit(ctx: CommandContext): Promise<void>;
/**
 * pull command
 */
export declare function runPull(ctx: CommandContext): Promise<void>;
//# sourceMappingURL=commands.d.ts.map