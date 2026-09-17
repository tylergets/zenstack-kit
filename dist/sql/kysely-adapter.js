/**
 * Kysely database adapter
 *
 * Provides utilities to create Kysely instances configured for use
 * with ZenStack-generated types.
 */
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
export async function createKyselyAdapter(options) {
    const dialect = options.kyselyDialect
        ? typeof options.kyselyDialect === "function"
            ? await options.kyselyDialect(options)
            : options.kyselyDialect
        : await createDefaultDialect(options);
    const { Kysely } = await import("kysely");
    const db = new Kysely({ dialect });
    return {
        dialect,
        db,
        destroy: async () => {
            await db.destroy();
        },
    };
}
async function createDefaultDialect(options) {
    // Import built-in drivers only when no custom dialect was supplied.
    let dialect;
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
