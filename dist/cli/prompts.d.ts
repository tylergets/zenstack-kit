/**
 * Interactive prompts for the init command using ink
 */
export type InitChoice = "skip" | "reinitialize" | "baseline" | "create_initial";
export type ConfirmChoice = "yes" | "no";
/**
 * Prompt user when snapshot already exists (Case A)
 */
export declare function promptSnapshotExists(): Promise<InitChoice>;
/**
 * Prompt user for fresh init when no migrations exist (Case C)
 */
export declare function promptFreshInit(): Promise<InitChoice>;
/**
 * Prompt user to confirm overwriting existing files during pull
 */
export declare function promptPullConfirm(existingFiles: string[]): Promise<boolean>;
export type RenameChoice = "rename" | "delete_create";
/**
 * Prompt user for migration name
 */
export declare function promptMigrationName(defaultName?: string): Promise<string>;
export type MigrationConfirmChoice = "create" | "cancel";
/**
 * Prompt user to confirm migration creation
 */
export declare function promptMigrationConfirm(migrationPath: string): Promise<MigrationConfirmChoice>;
/**
 * Prompt user to disambiguate a potential table rename
 */
export declare function promptTableRename(from: string, to: string): Promise<RenameChoice>;
/**
 * Prompt user to disambiguate a potential column rename
 */
export declare function promptColumnRename(table: string, from: string, to: string): Promise<RenameChoice>;
//# sourceMappingURL=prompts.d.ts.map