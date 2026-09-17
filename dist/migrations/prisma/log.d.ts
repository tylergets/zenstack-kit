export interface MigrationLogEntry {
    /** Migration folder name e.g. "20260108120000_init" */
    name: string;
    /** SHA256 checksum of migration.sql content (64 hex chars) */
    checksum: string;
}
/**
 * Calculate SHA256 checksum of migration SQL (v2: normalized, whitespace/comment-insensitive)
 */
export declare function calculateChecksum(sql: string): string;
/**
 * Recompute checksum using the same version as an existing stored checksum.
 * v1 (plain hex): raw SQL. v2 (v2:<hex>): normalized SQL.
 */
export declare function rehashWithSameVersion(sql: string, existingChecksum: string): string;
/**
 * Get the path to the migration log file
 */
export declare function getMigrationLogPath(outputPath: string): string;
/**
 * Read migration log file
 */
export declare function readMigrationLog(outputPath: string): Promise<MigrationLogEntry[]>;
/**
 * Write migration log file
 */
export declare function writeMigrationLog(outputPath: string, entries: MigrationLogEntry[]): Promise<void>;
/**
 * Append a single entry to the migration log
 */
export declare function appendToMigrationLog(outputPath: string, entry: MigrationLogEntry): Promise<void>;
/**
 * Scan migration folders and compute checksums for each.
 * Pass existingEntries to preserve checksum versions for already-tracked migrations.
 */
export declare function scanMigrationFolders(outputPath: string, existingEntries?: Map<string, MigrationLogEntry>): Promise<MigrationLogEntry[]>;
//# sourceMappingURL=log.d.ts.map