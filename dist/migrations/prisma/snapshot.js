import * as fs from "fs/promises";
import * as path from "path";
import { createSnapshot, generateSchemaSnapshot } from "../../schema/snapshot.js";
/**
 * Get paths for snapshot file
 */
export function getSnapshotPaths(outputPath) {
    const metaDir = path.join(outputPath, "meta");
    return {
        metaDir,
        snapshotPath: path.join(metaDir, "_snapshot.json"),
    };
}
/**
 * Read existing snapshot
 */
export async function readSnapshot(snapshotPath) {
    try {
        const content = await fs.readFile(snapshotPath, "utf-8");
        const snapshot = JSON.parse(content);
        if (!snapshot || snapshot.version !== 2 || !snapshot.schema) {
            throw new Error("Snapshot format is invalid");
        }
        return snapshot;
    }
    catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            return null;
        }
        throw error;
    }
}
/**
 * Write snapshot to file
 */
export async function writeSnapshot(snapshotPath, schema) {
    const snapshot = createSnapshot(schema);
    await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), "utf-8");
}
/**
 * Check if snapshot exists
 */
export async function hasSnapshot(outputPath) {
    const { snapshotPath } = getSnapshotPaths(outputPath);
    try {
        await fs.access(snapshotPath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Initialize snapshot from schema without generating migration
 */
export async function initializeSnapshot(options) {
    const currentSchema = await generateSchemaSnapshot(options.schemaPath);
    const { snapshotPath } = getSnapshotPaths(options.outputPath);
    await writeSnapshot(snapshotPath, currentSchema);
    return {
        snapshotPath,
        tableCount: currentSchema.tables.length,
    };
}
