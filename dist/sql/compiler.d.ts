/**
 * SQL Compiler - Generates raw SQL from schema operations using Kysely's compile()
 *
 * Uses Kysely with DummyDriver to compile schema operations to dialect-specific SQL
 * without requiring a database connection.
 */
import type { KyselyDialect } from "./kysely-adapter.js";
import type { SchemaTable, SchemaColumn, SchemaEnum } from "../schema/snapshot.js";
export interface SqlMigration {
    up: string[];
    down: string[];
}
export interface CompileSqlOptions {
    dialect: KyselyDialect;
}
/** Map ZenStack PascalCase referential action to Kysely's lowercase format */
export declare function toKyselyReferentialAction(action: string): string;
/**
 * Compile a CREATE TABLE statement to SQL
 */
export declare function compileCreateTable(model: SchemaTable, options: CompileSqlOptions): string;
/**
 * Compile a DROP TABLE statement to SQL
 */
export declare function compileDropTable(tableName: string, options: CompileSqlOptions): string;
/**
 * Compile an ADD COLUMN statement to SQL
 */
export declare function compileAddColumn(tableName: string, column: SchemaColumn, options: CompileSqlOptions): string;
/**
 * Compile a DROP COLUMN statement to SQL
 */
export declare function compileDropColumn(tableName: string, columnName: string, options: CompileSqlOptions): string;
/**
 * Compile a RENAME TABLE statement to SQL
 */
export declare function compileRenameTable(fromName: string, toName: string, options: CompileSqlOptions): string;
/**
 * Compile a RENAME COLUMN statement to SQL
 */
export declare function compileRenameColumn(tableName: string, fromName: string, toName: string, options: CompileSqlOptions): string;
/**
 * Compile a CREATE INDEX statement to SQL
 */
export declare function compileCreateIndex(tableName: string, indexName: string, columns: string[], options: CompileSqlOptions): string;
/**
 * Compile a DROP INDEX statement to SQL
 */
export declare function compileDropIndex(indexName: string, options: CompileSqlOptions): string;
/**
 * Compile an ADD CONSTRAINT (unique) statement to SQL
 */
export declare function compileAddUniqueConstraint(tableName: string, constraintName: string, columns: string[], options: CompileSqlOptions): string;
/**
 * Compile a DROP CONSTRAINT statement to SQL
 */
export declare function compileDropConstraint(tableName: string, constraintName: string, options: CompileSqlOptions): string;
/**
 * Compile an ADD FOREIGN KEY CONSTRAINT statement to SQL
 */
export declare function compileAddForeignKeyConstraint(tableName: string, constraintName: string, columns: string[], referencedTable: string, referencedColumns: string[], options: CompileSqlOptions, onDelete?: string, onUpdate?: string): string;
/**
 * Compile an ADD PRIMARY KEY CONSTRAINT statement to SQL
 */
export declare function compileAddPrimaryKeyConstraint(tableName: string, constraintName: string, columns: string[], options: CompileSqlOptions): string;
/**
 * Compile ALTER COLUMN statements for type/nullability/default changes
 */
export declare function compileAlterColumn(tableName: string, columnName: string, changes: {
    setType?: Pick<SchemaColumn, "type" | "isEnum" | "isArray" | "isAutoincrement">;
    setNotNull?: boolean;
    dropNotNull?: boolean;
    setDefault?: string | number | boolean;
    dropDefault?: boolean;
}, options: CompileSqlOptions): string[];
/**
 * Compile a CREATE TYPE ... AS ENUM statement for PostgreSQL
 * For MySQL and SQLite, enums are handled differently (inline or as text)
 */
export declare function compileCreateEnum(enumDef: SchemaEnum, options: CompileSqlOptions): string | null;
/**
 * Compile a DROP TYPE statement for PostgreSQL
 */
export declare function compileDropEnum(enumName: string, options: CompileSqlOptions): string | null;
/**
 * Compile an ALTER TYPE ... ADD VALUE statement for PostgreSQL
 * Adds a new value to an existing enum type
 */
export declare function compileAddEnumValue(enumName: string, value: string, options: CompileSqlOptions): string | null;
/**
 * Map column type considering enum types
 * For enum columns, returns the enum type name (PostgreSQL) or text (other dialects)
 */
export declare function mapColumnTypeWithEnum(column: SchemaColumn, dialect: KyselyDialect): string;
//# sourceMappingURL=compiler.d.ts.map