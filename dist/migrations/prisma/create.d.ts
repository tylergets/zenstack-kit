import type { KyselyDialect } from "../../sql/kysely-adapter.js";
export interface PrismaMigrationOptions {
    /** Migration name */
    name: string;
    /** Path to ZenStack schema file */
    schemaPath: string;
    /** Output directory for migration files */
    outputPath: string;
    /** Database dialect for SQL generation */
    dialect: KyselyDialect;
    /** Table rename mappings */
    renameTables?: Array<{
        from: string;
        to: string;
    }>;
    /** Column rename mappings */
    renameColumns?: Array<{
        table: string;
        from: string;
        to: string;
    }>;
}
export interface PrismaMigration {
    /** Migration folder name (timestamp_name) */
    folderName: string;
    /** Full path to migration folder */
    folderPath: string;
    /** SQL content */
    sql: string;
    /** Timestamp */
    timestamp: number;
}
export interface CreateInitialMigrationOptions {
    /** Migration name (default: "init") */
    name?: string;
    /** Path to ZenStack schema file */
    schemaPath: string;
    /** Output directory for migration files */
    outputPath: string;
    /** Database dialect for SQL generation */
    dialect: KyselyDialect;
}
export interface CreateEmptyMigrationOptions {
    /** Migration name */
    name: string;
    /** Path to ZenStack schema file */
    schemaPath: string;
    /** Output directory for migration files */
    outputPath: string;
    /** Update snapshot to current schema */
    updateSnapshot?: boolean;
}
/**
 * Generate timestamp string for migration folder name
 */
export declare function generateTimestamp(): string;
/**
 * Create a Prisma-compatible empty migration
 */
export declare function createEmptyMigration(options: CreateEmptyMigrationOptions): Promise<PrismaMigration>;
/**
 * Create a Prisma-compatible migration
 */
export declare function createPrismaMigration(options: PrismaMigrationOptions): Promise<PrismaMigration | null>;
/**
 * Create an initial migration that creates all tables from scratch.
 * This is used when initializing a project where the database is empty.
 */
export declare function createInitialMigration(options: CreateInitialMigrationOptions): Promise<PrismaMigration>;
/**
 * Check if there are schema changes
 */
export declare function hasPrismaSchemaChanges(options: {
    schemaPath: string;
    outputPath: string;
}): Promise<boolean>;
//# sourceMappingURL=create.d.ts.map