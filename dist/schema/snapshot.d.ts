/**
 * Schema snapshot utilities for ZenStack schemas
 *
 * Uses ZenStack's AST to create a stable, diffable schema snapshot.
 */
export interface SchemaColumn {
    name: string;
    type: string;
    notNull: boolean;
    isArray: boolean;
    default?: string | number | boolean;
    isAutoincrement?: boolean;
    /** If true, type refers to an enum name rather than a SQL type */
    isEnum?: boolean;
}
export interface SchemaConstraint {
    name: string;
    columns: string[];
}
export interface SchemaIndex {
    name: string;
    columns: string[];
}
export type ReferentialAction = "Cascade" | "Restrict" | "SetNull" | "SetDefault" | "NoAction";
export interface SchemaForeignKey {
    name: string;
    columns: string[];
    referencedTable: string;
    referencedColumns: string[];
    onDelete?: ReferentialAction;
    onUpdate?: ReferentialAction;
}
export interface SchemaTable {
    name: string;
    columns: SchemaColumn[];
    primaryKey?: SchemaConstraint;
    uniqueConstraints: SchemaConstraint[];
    indexes: SchemaIndex[];
    foreignKeys: SchemaForeignKey[];
}
export interface SchemaEnum {
    name: string;
    values: string[];
}
export interface SchemaSnapshot {
    tables: SchemaTable[];
    enums: SchemaEnum[];
}
export interface SchemaSnapshotFile {
    version: 2;
    createdAt: string;
    schema: SchemaSnapshot;
}
export declare function generateSchemaSnapshot(schemaPath: string): Promise<SchemaSnapshot>;
export declare function createSnapshot(schema: SchemaSnapshot): SchemaSnapshotFile;
//# sourceMappingURL=snapshot.d.ts.map