/**
 * Schema introspection utilities
 *
 * Provides functionality to introspect ZenStack schemas and databases,
 * extracting model and field information for code generation.
 */
export interface FieldInfo {
    /** Field name */
    name: string;
    /** Field type (String, Int, Boolean, etc.) */
    type: string;
    /** Whether the field is optional */
    isOptional: boolean;
    /** Whether the field is an array */
    isArray: boolean;
    /** Whether this is a relation field */
    isRelation: boolean;
    /** Whether this is the primary key */
    isId: boolean;
    /** Whether the field has a default value */
    hasDefault: boolean;
    /** Whether the field is unique */
    isUnique: boolean;
    /** Related model name (for relations) */
    relationModel?: string;
}
export interface ModelInfo {
    /** Model name */
    name: string;
    /** Table name in database */
    tableName: string;
    /** Model fields */
    fields: FieldInfo[];
}
export interface SchemaInfo {
    /** All models in the schema */
    models: ModelInfo[];
    /** Schema version or hash */
    version: string;
}
interface IntrospectOptions {
    /** Path to ZenStack schema file */
    schemaPath?: string;
    /** Database connection URL (for database introspection) */
    databaseUrl?: string;
    /** Output path for generated schema */
    outputPath?: string;
}
/**
 * Introspect schema from file or database
 */
export declare function introspectSchema(options: IntrospectOptions): Promise<SchemaInfo>;
export {};
//# sourceMappingURL=introspect.d.ts.map