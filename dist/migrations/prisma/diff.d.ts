import type { KyselyDialect } from "../../sql/kysely-adapter.js";
import type { SchemaSnapshot, SchemaTable, SchemaColumn, SchemaEnum, SchemaForeignKey } from "../../schema/snapshot.js";
export declare function diffSchemas(previous: SchemaSnapshot | null, current: SchemaSnapshot): {
    addedModels: SchemaTable[];
    removedModels: SchemaTable[];
    addedFields: {
        tableName: string;
        column: SchemaColumn;
    }[];
    removedFields: {
        tableName: string;
        column: SchemaColumn;
    }[];
    alteredFields: {
        tableName: string;
        columnName: string;
        previous: SchemaColumn;
        current: SchemaColumn;
    }[];
    addedUniqueConstraints: {
        tableName: string;
        constraint: {
            name: string;
            columns: string[];
        };
    }[];
    removedUniqueConstraints: {
        tableName: string;
        constraint: {
            name: string;
            columns: string[];
        };
    }[];
    addedIndexes: {
        tableName: string;
        index: {
            name: string;
            columns: string[];
        };
    }[];
    removedIndexes: {
        tableName: string;
        index: {
            name: string;
            columns: string[];
        };
    }[];
    addedForeignKeys: {
        tableName: string;
        foreignKey: SchemaForeignKey;
    }[];
    removedForeignKeys: {
        tableName: string;
        foreignKey: SchemaForeignKey;
    }[];
    primaryKeyChanges: {
        tableName: string;
        previous?: {
            name: string;
            columns: string[];
        };
        current?: {
            name: string;
            columns: string[];
        };
    }[];
    renamedTables: Array<{
        from: string;
        to: string;
    }>;
    renamedColumns: Array<{
        tableName: string;
        from: string;
        to: string;
    }>;
    addedEnums: SchemaEnum[];
    removedEnums: SchemaEnum[];
    alteredEnums: {
        enumName: string;
        addedValues: string[];
        removedValues: string[];
    }[];
};
type PrismaDiff = ReturnType<typeof diffSchemas>;
export declare function applyRenameMappings(diff: PrismaDiff, renameTables?: Array<{
    from: string;
    to: string;
}>, renameColumns?: Array<{
    table: string;
    from: string;
    to: string;
}>): PrismaDiff;
/**
 * Build SQL statements from diff
 */
export declare function buildSqlStatements(diff: ReturnType<typeof diffSchemas>, dialect: KyselyDialect): {
    up: string[];
    down: string[];
};
export {};
//# sourceMappingURL=diff.d.ts.map