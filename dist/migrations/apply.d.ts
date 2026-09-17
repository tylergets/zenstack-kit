/**
 * Apply migrations using Kysely's migrator
 */
import type { KyselyAdapterOptions } from "../sql/kysely-adapter.js";
export interface ApplyMigrationsOptions extends KyselyAdapterOptions {
    migrationsFolder: string;
}
export interface ApplyMigrationsResult {
    results: Array<{
        migrationName: string;
        status: string;
    }>;
}
export declare function applyMigrations(options: ApplyMigrationsOptions): Promise<ApplyMigrationsResult>;
//# sourceMappingURL=apply.d.ts.map