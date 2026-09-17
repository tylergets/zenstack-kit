/**
 * High-level programmatic API for zenstack-kit migrations
 *
 * This module provides a simple interface for applying migrations from code,
 * useful for running migrations during application startup or in CI/CD pipelines.
 *
 * @example
 * ```typescript
 * import { migrate } from "zenstack-kit";
 *
 * // Apply migrations using config file
 * await migrate();
 *
 * // Apply migrations with explicit options
 * await migrate({
 *   migrationsFolder: "./prisma/migrations",
 *   dialect: "postgres",
 *   connectionUrl: process.env.DATABASE_URL,
 * });
 *
 * // Preview migrations without applying
 * const result = await migrate({ preview: true });
 * console.log("Pending migrations:", result.pending);
 * ```
 */
import { type ApplyPrismaMigrationsResult, type PreviewPrismaMigrationsResult } from "./migrations/prisma.js";
import type { KyselyDialect, KyselyDialectProvider } from "./sql/kysely-adapter.js";
import type { MigrationSqlExecutor } from "./migrations/prisma/apply.js";
export interface MigrateOptions {
    /** Override built-in drivers with a dialect or fresh-dialect factory. */
    kyselyDialect?: KyselyDialectProvider;
    /** Execute complete SQL files when using a custom dialect. */
    executeMigrationSql?: MigrationSqlExecutor;
    /**
     * Path to migrations folder.
     * If not provided, will be read from config file.
     */
    migrationsFolder?: string;
    /**
     * Database dialect: "sqlite", "postgres", or "mysql"
     * If not provided, will be read from config file.
     */
    dialect?: KyselyDialect;
    /**
     * Database connection URL (for postgres/mysql).
     * If not provided, will be read from config file.
     */
    connectionUrl?: string;
    /**
     * SQLite database file path.
     * If not provided, will be read from config file.
     */
    databasePath?: string;
    /**
     * Migrations table name.
     * @default "_prisma_migrations"
     */
    migrationsTable?: string;
    /**
     * Migrations schema (PostgreSQL only).
     * @default "public"
     */
    migrationsSchema?: string;
    /**
     * If true, preview pending migrations without applying them.
     * @default false
     */
    preview?: boolean;
    /**
     * Apply a single migration by name (must be the next pending one).
     */
    migration?: string;
    /**
     * Enforce pending migration log checksums (no auto-rehash).
     * @default false
     */
    strict?: boolean;
    /**
     * Current working directory for config resolution.
     * @default process.cwd()
     */
    cwd?: string;
}
export type MigrateResult = (ApplyPrismaMigrationsResult & {
    mode: "apply";
}) | (PreviewPrismaMigrationsResult & {
    mode: "preview";
});
/**
 * Apply or preview database migrations programmatically.
 *
 * This function can be used in application code to run migrations during startup,
 * or in scripts and CI/CD pipelines.
 *
 * @param options - Migration options. If not provided, reads from config file.
 * @returns Result of migration apply or preview operation.
 * @throws Error if migrations fail or required configuration is missing.
 *
 * @example
 * ```typescript
 * // Run migrations on app startup
 * import { migrate } from "zenstack-kit";
 *
 * async function main() {
 *   const result = await migrate();
 *   console.log(`Applied ${result.applied.length} migrations`);
 *
 *   // Start your app...
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Preview in development
 * const preview = await migrate({ preview: true });
 * if (preview.pending.length > 0) {
 *   console.log("Pending migrations:", preview.pending.map(m => m.name));
 * }
 * ```
 */
export declare function migrate(options?: MigrateOptions): Promise<MigrateResult>;
//# sourceMappingURL=migrate.d.ts.map