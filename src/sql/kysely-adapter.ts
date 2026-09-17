/**
 * Kysely database adapter
 *
 * Provides utilities to create Kysely instances configured for use
 * with ZenStack-generated types.
 */

import type { Kysely, Dialect } from "kysely";

export type KyselyDialect = "sqlite" | "postgres" | "mysql";

export type KyselyDialectProvider =
  | Dialect
  | ((options: KyselyAdapterOptions) => Dialect | Promise<Dialect>);

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
export async function createKyselyAdapter<DB>(
  options: KyselyAdapterOptions
): Promise<KyselyAdapter<DB>> {
  const dialect = options.kyselyDialect
    ? typeof options.kyselyDialect === "function"
      ? await options.kyselyDialect(options)
      : options.kyselyDialect
    : await createDefaultDialect(options);

  const { Kysely } = await import("kysely");
  const db = new Kysely<DB>({ dialect });

  return {
    dialect,
    db,
    destroy: async () => {
      await db.destroy();
    },
  };
}

async function createDefaultDialect(options: KyselyAdapterOptions): Promise<Dialect> {
  // Import built-in drivers only when no custom dialect was supplied.
  let dialect: Dialect;

  switch (options.dialect) {
    case "sqlite": {
      const { default: Database } = await import("better-sqlite3");
      const { SqliteDialect } = await import("kysely");

      dialect = new SqliteDialect({
        database: new Database(options.databasePath || ":memory:"),
      });
      break;
    }

    case "postgres": {
      // Note: User needs to install pg package
      const { Pool } = await import("pg");
      const { PostgresDialect } = await import("kysely");

      dialect = new PostgresDialect({
        pool: new Pool({
          connectionString: options.connectionUrl,
          min: options.pool?.min ?? 2,
          max: options.pool?.max ?? 10,
        }),
      });
      break;
    }

    case "mysql": {
      // Note: User needs to install mysql2 package
      const mysql = await import("mysql2");
      const { MysqlDialect } = await import("kysely");

      dialect = new MysqlDialect({
        pool: mysql.createPool({
          uri: options.connectionUrl,
        }),
      });
      break;
    }

    default:
      throw new Error(`Unsupported dialect: ${options.dialect}`);
  }

  return dialect;
}
