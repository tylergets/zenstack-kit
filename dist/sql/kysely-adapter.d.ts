/**
 * Kysely database adapter
 *
 * Provides utilities to create Kysely instances configured for use
 * with ZenStack-generated types.
 */
import type { Kysely, Dialect } from "kysely";
export type KyselyDialect = "sqlite" | "postgres" | "mysql";
export type KyselyDialectProvider = Dialect | ((options: KyselyAdapterOptions) => Dialect | Promise<Dialect>);
export interface KyselyAdapterOptions {
    /** Database dialect */
    dialect: KyselyDialect;
    /** Override the default driver. Each invocation owns and destroys its dialect. */
    kyselyDialect?: KyselyDialectProvider;
    /** Database connection URL */
    connectionUrl?: string;
    /** SQLite database path (for SQLite dialect) */
    databasePath?: string;
    /** Connection pool settings */
    pool?: {
        min?: number;
        max?: number;
    };
}
export interface KyselyAdapter<DB> {
    /** The resolved dialect, owned by this adapter. */
    dialect: Dialect;
    /** The Kysely instance */
    db: Kysely<DB>;
    /** Destroy the connection pool */
    destroy: () => Promise<void>;
}
/**
 * Creates a Kysely adapter for use with ZenStack schemas
 *
 * @example
 * ```ts
 * import { createKyselyAdapter } from "zenstack-kit";
 * import type { Database } from "./generated/kysely-types";
 *
 * const { db, destroy } = await createKyselyAdapter<Database>({
 *   dialect: "postgres",
 *   connectionUrl: process.env.DATABASE_URL,
 * });
 *
 * // Use db for queries
 * const users = await db.selectFrom("user").selectAll().execute();
 *
 * // Clean up
 * await destroy();
 * ```
 */
export declare function createKyselyAdapter<DB>(options: KyselyAdapterOptions): Promise<KyselyAdapter<DB>>;
//# sourceMappingURL=kysely-adapter.d.ts.map