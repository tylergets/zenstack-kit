/**
 * Migration generation and management
 *
 * Creates and manages database migrations based on ZenStack schema changes
 * using AST-based diffs and Kysely schema builder operations.
 */
import { type SchemaTable, type SchemaColumn } from "../schema/snapshot.js";
export interface MigrationOptions {
    /** Migration name */
    name?: string;
    /** Path to ZenStack schema file */
    schemaPath: string;
    /** Output directory for migration files */
    outputPath: string;
    /** Optional snapshot file override */
    snapshotPath?: string;
    /** Table rename mappings */
    renameTables?: Array<{
        from: string;
        to: string;
    }>;
    /** Column rename mappings */
    renameColumns?: Array<{
        table: string;
        from: string;
        to: string;
    }>;
}
export interface Migration {
    /** Migration filename */
    filename: string;
    /** Kysely schema builder up migration */
    up: string;
    /** Kysely schema builder down migration */
    down: string;
    /** Timestamp */
    timestamp: number;
}
interface FieldChange {
    model: SchemaTable;
    tableName: string;
    columnName: string;
    previous: SchemaColumn;
    current: SchemaColumn;
    changes: {
        typeChanged: boolean;
        requiredChanged: boolean;
        defaultChanged: boolean;
        listChanged: boolean;
    };
}
interface DiffResult {
    addedModels: SchemaTable[];
    removedModels: SchemaTable[];
    addedFields: Array<{
        model: SchemaTable;
        tableName: string;
        field: SchemaColumn;
        columnName: string;
    }>;
    removedFields: Array<{
        model: SchemaTable;
        tableName: string;
        field: SchemaColumn;
        columnName: string;
    }>;
    alteredFields: FieldChange[];
    renamedTables: Array<{
        from: string;
        to: string;
    }>;
    renamedColumns: Array<{
        tableName: string;
        from: string;
        to: string;
    }>;
    addedUniqueConstraints: Array<{
        tableName: string;
        constraint: {
            name: string;
            columns: string[];
        };
    }>;
    removedUniqueConstraints: Array<{
        tableName: string;
        constraint: {
            name: string;
            columns: string[];
        };
    }>;
    addedIndexes: Array<{
        tableName: string;
        index: {
            name: string;
            columns: string[];
        };
    }>;
    removedIndexes: Array<{
        tableName: string;
        index: {
            name: string;
            columns: string[];
        };
    }>;
    addedForeignKeys: Array<{
        tableName: string;
        foreignKey: {
            name: string;
            columns: string[];
            referencedTable: string;
            referencedColumns: string[];
        };
    }>;
    removedForeignKeys: Array<{
        tableName: string;
        foreignKey: {
            name: string;
            columns: string[];
            referencedTable: string;
            referencedColumns: string[];
        };
    }>;
    primaryKeyChanges: Array<{
        tableName: string;
        previous?: {
            name: string;
            columns: string[];
        };
        current?: {
            name: string;
            columns: string[];
        };
    }>;
}
export declare function getSchemaDiff(options: MigrationOptions): Promise<DiffResult>;
export declare function hasSchemaChanges(options: MigrationOptions): Promise<boolean>;
export interface InitSnapshotOptions {
    /** Path to ZenStack schema file */
    schemaPath: string;
    /** Output directory for migrations (snapshot will be in meta subfolder) */
    outputPath: string;
    /** Optional snapshot file override */
    snapshotPath?: string;
}
export interface InitSnapshotResult {
    /** Path to the created snapshot file */
    snapshotPath: string;
    /** Number of tables in the snapshot */
    tableCount: number;
}
/**
 * Initialize a snapshot from the current schema without generating a migration.
 * Use this to baseline an existing database before starting to track migrations.
 */
export declare function initSnapshot(options: InitSnapshotOptions): Promise<InitSnapshotResult>;
/**
 * Create a migration file from schema changes
 */
export declare function createMigration(options: MigrationOptions): Promise<Migration | null>;
export {};
//# sourceMappingURL=diff.d.ts.map