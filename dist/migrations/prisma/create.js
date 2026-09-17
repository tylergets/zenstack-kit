import * as fs from "fs/promises";
import * as path from "path";
import { generateSchemaSnapshot } from "../../schema/snapshot.js";
import { applyRenameMappings, buildSqlStatements, diffSchemas } from "./diff.js";
import { appendToMigrationLog, calculateChecksum } from "./log.js";
import { getSnapshotPaths, readSnapshot, writeSnapshot } from "./snapshot.js";
/**
 * Generate timestamp string for migration folder name
 */
export function generateTimestamp() {
    const now = new Date();
    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0"),
    ].join("");
}
/**
 * Create a Prisma-compatible empty migration
 */
export async function createEmptyMigration(options) {
    const timestamp = Date.now();
    const timestampStr = generateTimestamp();
    const safeName = options.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const folderName = `${timestampStr}_${safeName}`;
    const folderPath = path.join(options.outputPath, folderName);
    const sqlContent = [
        `-- Migration: ${options.name}`,
        `-- Generated at: ${new Date(timestamp).toISOString()}`,
        "",
        "",
    ].join("\n");
    await fs.mkdir(folderPath, { recursive: true });
    await fs.writeFile(path.join(folderPath, "migration.sql"), sqlContent, "utf-8");
    if (options.updateSnapshot) {
        const currentSchema = await generateSchemaSnapshot(options.schemaPath);
        const { snapshotPath } = getSnapshotPaths(options.outputPath);
        await writeSnapshot(snapshotPath, currentSchema);
    }
    const checksum = calculateChecksum(sqlContent);
    await appendToMigrationLog(options.outputPath, { name: folderName, checksum });
    return {
        folderName,
        folderPath,
        sql: sqlContent,
        timestamp,
    };
}
/**
 * Create a Prisma-compatible migration
 */
export async function createPrismaMigration(options) {
    const currentSchema = await generateSchemaSnapshot(options.schemaPath);
    const { snapshotPath } = getSnapshotPaths(options.outputPath);
    const previousSnapshot = await readSnapshot(snapshotPath);
    const diff = applyRenameMappings(diffSchemas(previousSnapshot?.schema ?? null, currentSchema), options.renameTables, options.renameColumns);
    const { up } = buildSqlStatements(diff, options.dialect);
    if (up.length === 0) {
        return null;
    }
    const timestamp = Date.now();
    const timestampStr = generateTimestamp();
    const safeName = options.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const folderName = `${timestampStr}_${safeName}`;
    const folderPath = path.join(options.outputPath, folderName);
    // Build migration.sql content with comments
    const sqlContent = [
        `-- Migration: ${options.name}`,
        `-- Generated at: ${new Date(timestamp).toISOString()}`,
        "",
        ...up,
        "",
    ].join("\n");
    // Create migration folder and file
    await fs.mkdir(folderPath, { recursive: true });
    await fs.writeFile(path.join(folderPath, "migration.sql"), sqlContent, "utf-8");
    // Update snapshot
    await writeSnapshot(snapshotPath, currentSchema);
    // Append to migration log
    const checksum = calculateChecksum(sqlContent);
    await appendToMigrationLog(options.outputPath, { name: folderName, checksum });
    return {
        folderName,
        folderPath,
        sql: sqlContent,
        timestamp,
    };
}
/**
 * Create an initial migration that creates all tables from scratch.
 * This is used when initializing a project where the database is empty.
 */
export async function createInitialMigration(options) {
    const currentSchema = await generateSchemaSnapshot(options.schemaPath);
    const { snapshotPath } = getSnapshotPaths(options.outputPath);
    // Diff against empty schema to get full creation SQL
    const diff = diffSchemas(null, currentSchema);
    const { up } = buildSqlStatements(diff, options.dialect);
    const timestamp = Date.now();
    const timestampStr = generateTimestamp();
    const safeName = (options.name ?? "init").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const folderName = `${timestampStr}_${safeName}`;
    const folderPath = path.join(options.outputPath, folderName);
    // Build migration.sql content with comments
    const sqlContent = [
        `-- Migration: ${options.name ?? "init"}`,
        `-- Generated at: ${new Date(timestamp).toISOString()}`,
        "",
        ...up,
        "",
    ].join("\n");
    // Create migration folder and file
    await fs.mkdir(folderPath, { recursive: true });
    await fs.writeFile(path.join(folderPath, "migration.sql"), sqlContent, "utf-8");
    // Update snapshot
    await writeSnapshot(snapshotPath, currentSchema);
    // Append to migration log
    const checksum = calculateChecksum(sqlContent);
    await appendToMigrationLog(options.outputPath, { name: folderName, checksum });
    return {
        folderName,
        folderPath,
        sql: sqlContent,
        timestamp,
    };
}
/**
 * Check if there are schema changes
 */
export async function hasPrismaSchemaChanges(options) {
    const currentSchema = await generateSchemaSnapshot(options.schemaPath);
    const { snapshotPath } = getSnapshotPaths(options.outputPath);
    const previousSnapshot = await readSnapshot(snapshotPath);
    const diff = diffSchemas(previousSnapshot?.schema ?? null, currentSchema);
    return (diff.addedModels.length > 0 ||
        diff.removedModels.length > 0 ||
        diff.addedFields.length > 0 ||
        diff.removedFields.length > 0 ||
        diff.alteredFields.length > 0 ||
        diff.addedUniqueConstraints.length > 0 ||
        diff.removedUniqueConstraints.length > 0 ||
        diff.addedIndexes.length > 0 ||
        diff.removedIndexes.length > 0 ||
        diff.addedForeignKeys.length > 0 ||
        diff.removedForeignKeys.length > 0 ||
        diff.primaryKeyChanges.length > 0);
}
