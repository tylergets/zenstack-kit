import { type Dialect } from "kysely";
import type { KyselyAdapterOptions } from "../../sql/kysely-adapter.js";
import type { KyselyDialect } from "../../sql/kysely-adapter.js";
import { createKyselyAdapter } from "../../sql/kysely-adapter.js";
export type MigrationSqlExecutor = (sqlContent: string, db: Awaited<ReturnType<typeof createKyselyAdapter>>["db"], dialect: Dialect) => void | Promise<void>;
export interface ApplyPrismaMigrationsOptions extends KyselyAdapterOptions {
    /** Migrations folder path */
    migrationsFolder: string;
    /** Database dialect */
    dialect: KyselyDialect;
    /** Database connection URL */
    connectionUrl?: string;
    /** SQLite database path */
    databasePath?: string;
    /** Execute a whole SQL file. Required for applying SQL with a custom dialect. */
    executeMigrationSql?: MigrationSqlExecutor;
    /** Migrations table name (default: _prisma_migrations) */
    migrationsTable?: string;
    /** Migrations schema (PostgreSQL only, default: public) */
    migrationsSchema?: string;
    /** Mark migrations as applied without executing SQL */
    markApplied?: boolean;
    /** Enforce checksum/log consistency for pending migrations (no auto-rehash) */
    strict?: boolean;
    /** Apply a single migration by name */
    targetMigration?: string;
    /** Apply all unapplied migrations regardless of gaps in applied history */
    ignoreOrderMismatch?: boolean;
}
export interface ApplyPrismaMigrationsResult {
    applied: Array<{
        migrationName: string;
        duration: number;
    }>;
    alreadyApplied: string[];
    failed?: {
        migrationName: string;
        error: string;
    };
    coherenceErrors?: MigrationCoherenceError[];
}
export interface MigrationCoherenceError {
    type: "missing_from_log" | "missing_from_db" | "missing_from_disk" | "order_mismatch" | "checksum_mismatch";
    migrationName: string;
    details: string;
}
export interface MigrationCoherenceResult {
    isCoherent: boolean;
    errors: MigrationCoherenceError[];
}
export interface PreviewPrismaMigrationsResult {
    pending: Array<{
        name: string;
        sql: string;
    }>;
    alreadyApplied: string[];
}
/**
 * Apply pending Prisma migrations
 */
export declare function applyPrismaMigrations(options: ApplyPrismaMigrationsOptions): Promise<ApplyPrismaMigrationsResult>;
/**
 * Preview pending migrations without applying them
 */
export declare function previewPrismaMigrations(options: ApplyPrismaMigrationsOptions): Promise<PreviewPrismaMigrationsResult>;
//# sourceMappingURL=apply.d.ts.map