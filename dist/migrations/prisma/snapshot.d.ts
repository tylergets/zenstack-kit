import type { SchemaSnapshot } from "../../schema/snapshot.js";
import { type SchemaSnapshotFile } from "../../schema/snapshot.js";
/**
 * Get paths for snapshot file
 */
export declare function getSnapshotPaths(outputPath: string): {
    metaDir: string;
    snapshotPath: string;
};
/**
 * Read existing snapshot
 */
export declare function readSnapshot(snapshotPath: string): Promise<SchemaSnapshotFile | null>;
/**
 * Write snapshot to file
 */
export declare function writeSnapshot(snapshotPath: string, schema: SchemaSnapshot): Promise<void>;
/**
 * Check if snapshot exists
 */
export declare function hasSnapshot(outputPath: string): Promise<boolean>;
/**
 * Initialize snapshot from schema without generating migration
 */
export declare function initializeSnapshot(options: {
    schemaPath: string;
    outputPath: string;
}): Promise<{
    snapshotPath: string;
    tableCount: number;
}>;
//# sourceMappingURL=snapshot.d.ts.map