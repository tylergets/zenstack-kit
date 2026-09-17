/**
 * Database pull utilities
 *
 * Uses Kysely introspection to generate a ZenStack schema from a live database.
 */
import { type KyselyDialect, type KyselyAdapterOptions } from "../sql/kysely-adapter.js";
export interface PullOptions extends KyselyAdapterOptions {
    /** Database dialect */
    dialect: KyselyDialect;
    /** Database connection URL */
    connectionUrl?: string;
    /** SQLite database path (for SQLite dialect) */
    databasePath?: string;
    /** Output path for schema */
    outputPath: string;
    /** Write the schema to outputPath (default: true) */
    writeFile?: boolean;
}
export interface PullResult {
    outputPath: string;
    schema: string;
    tableCount: number;
}
export declare function pullSchema(options: PullOptions): Promise<PullResult>;
//# sourceMappingURL=pull.d.ts.map