/**
 * Schema snapshot utilities for ZenStack schemas
 *
 * Uses ZenStack's AST to create a stable, diffable schema snapshot.
 */
import { loadDocument } from "@zenstackhq/language";
import { isDataField, isDataModel, isEnum } from "@zenstackhq/language/ast";
function getAttribute(node, name) {
    return node.attributes.find((attr) => attr.decl.$refText === name);
}
function getAttributeStringArg(attr, names) {
    if (!attr)
        return undefined;
    for (const arg of attr.args) {
        const paramName = arg.$resolvedParam?.name;
        if (paramName && names.includes(paramName)) {
            if (arg.value?.$type === "StringLiteral") {
                return arg.value.value;
            }
        }
    }
    const firstArg = attr.args[0];
    if (firstArg?.value?.$type === "StringLiteral") {
        return firstArg.value.value;
    }
    return undefined;
}
function getAttributeArrayRefs(attr, name) {
    if (!attr)
        return undefined;
    const arg = attr.args.find((item) => item.$resolvedParam?.name === name) ?? attr.args[0];
    if (!arg?.value || arg.value.$type !== "ArrayExpr") {
        return undefined;
    }
    const refs = arg.value.items
        .filter((item) => item.$type === "ReferenceExpr")
        .map((item) => item.target.$refText);
    return refs.length > 0 ? refs : undefined;
}
function getDefaultValue(field) {
    const attr = getAttribute(field, "@default");
    if (!attr) {
        return { hasDefault: false };
    }
    const valueArg = attr.args.find((arg) => arg.$resolvedParam?.name === "value") ?? attr.args[0];
    const expr = valueArg?.value;
    if (!expr) {
        return { hasDefault: true };
    }
    if (expr.$type === "StringLiteral") {
        return { hasDefault: true, default: expr.value };
    }
    if (expr.$type === "NumberLiteral") {
        return { hasDefault: true, default: Number(expr.value) };
    }
    if (expr.$type === "BooleanLiteral") {
        return { hasDefault: true, default: expr.value };
    }
    // Handle function calls like autoincrement(), now(), etc.
    if (expr.$type === "InvocationExpr") {
        const funcName = expr.function.$refText;
        if (funcName === "autoincrement") {
            return { hasDefault: true, isAutoincrement: true };
        }
        if (funcName === "now") {
            return { hasDefault: true, default: "now()" };
        }
        // cuid(), uuid(), nanoid() are handled at the application level by ZenStack/Prisma,
        // not at the database level. We mark hasDefault as true so the column isn't
        // required in INSERT statements (the ORM will provide the value).
        if (funcName === "cuid" || funcName === "uuid" || funcName === "nanoid") {
            return { hasDefault: true };
        }
        // Return function name for other functions (dbgenerated, etc.)
        return { hasDefault: true, default: `${funcName}()` };
    }
    // Handle enum default values like @default(USER) - these are ReferenceExpr
    if (expr.$type === "ReferenceExpr") {
        const enumValue = expr.target.$refText;
        return { hasDefault: true, default: enumValue };
    }
    return { hasDefault: true };
}
function getTableName(model) {
    const mapAttr = getAttribute(model, "@@map");
    const mapped = getAttributeStringArg(mapAttr, ["name", "map"]);
    return mapped ?? model.name;
}
function getColumnName(field) {
    const mapAttr = getAttribute(field, "@map");
    return getAttributeStringArg(mapAttr, ["name", "map"]) ?? field.name;
}
function mapFieldTypeToSQL(fieldType) {
    const typeMap = {
        String: "text",
        Int: "integer",
        Float: "double precision",
        Boolean: "boolean",
        DateTime: "timestamp",
        BigInt: "bigint",
        Decimal: "decimal",
        Json: "json",
        Bytes: "blob",
    };
    return typeMap[fieldType] ?? "text";
}
/**
 * Prisma-compatible constraint naming conventions
 *
 * Prisma uses PostgreSQL-aligned naming:
 * - Primary Key: {Table}_pkey
 * - Unique: {Table}_{columns}_key
 * - Index: {Table}_{columns}_idx
 * - Foreign Key: {Table}_{columns}_fkey
 */
function buildPrimaryKeyName(tableName, explicitName) {
    return explicitName ?? `${tableName}_pkey`;
}
function buildUniqueName(tableName, columns, explicitName) {
    if (explicitName)
        return explicitName;
    return `${tableName}_${columns.join("_")}_key`;
}
function buildIndexName(tableName, columns, explicitName) {
    if (explicitName)
        return explicitName;
    return `${tableName}_${columns.join("_")}_idx`;
}
function buildForeignKeyName(tableName, columns, _referencedTable, _referencedColumns, explicitName) {
    if (explicitName)
        return explicitName;
    // Prisma uses {Table}_{columns}_fkey (doesn't include referenced table/columns in name)
    return `${tableName}_${columns.join("_")}_fkey`;
}
function getFieldType(field) {
    const ref = field.type.reference?.ref;
    if (ref && isDataModel(ref)) {
        return { type: ref.name, isRelation: true, isEnum: false };
    }
    if (ref && isEnum(ref)) {
        return { type: ref.name, isRelation: false, isEnum: true };
    }
    return { type: field.type.type ?? "String", isRelation: false, isEnum: false };
}
function getAttributeRefArg(attr, name) {
    if (!attr)
        return undefined;
    const arg = attr.args.find((item) => item.$resolvedParam?.name === name);
    if (!arg?.value)
        return undefined;
    // Enum reference: e.g. Cascade, SetNull
    if (arg.value.$type === "ReferenceExpr") {
        return arg.value.target.$refText;
    }
    return undefined;
}
function getRelationFieldNames(field) {
    const relationAttr = getAttribute(field, "@relation");
    if (!relationAttr)
        return null;
    const fields = getAttributeArrayRefs(relationAttr, "fields");
    const references = getAttributeArrayRefs(relationAttr, "references");
    if (!fields || !references)
        return null;
    const mapName = getAttributeStringArg(relationAttr, ["map", "name"]);
    const onDelete = getAttributeRefArg(relationAttr, "onDelete");
    const onUpdate = getAttributeRefArg(relationAttr, "onUpdate");
    return { fields, references, mapName, onDelete, onUpdate };
}
function buildFieldNameMap(model) {
    const map = new Map();
    for (const field of model.fields) {
        if (!isDataField(field))
            continue;
        map.set(field.name, getColumnName(field));
    }
    return map;
}
function parseModel(model) {
    const tableName = getTableName(model);
    const columns = [];
    const fieldNameMap = buildFieldNameMap(model);
    for (const field of model.fields) {
        if (!isDataField(field))
            continue;
        const typeInfo = getFieldType(field);
        if (typeInfo.isRelation) {
            continue;
        }
        const defaultInfo = getDefaultValue(field);
        const columnName = getColumnName(field);
        // For enum types, store the enum name directly.
        // For fields with @json attribute, treat as json regardless of the field's type name
        // (supports custom types like `TranslatedField[] @json`).
        // For all other types, map to SQL type.
        const hasJsonAttr = !!getAttribute(field, "@json");
        const columnType = typeInfo.isEnum
            ? typeInfo.type
            : hasJsonAttr
                ? "json"
                : mapFieldTypeToSQL(typeInfo.type);
        columns.push({
            name: columnName,
            type: columnType,
            notNull: !field.type.optional,
            // @json fields store the entire value (including arrays) as a single JSON blob,
            // so isArray must be false to avoid generating jsonb[] instead of jsonb in PostgreSQL.
            isArray: hasJsonAttr ? false : (field.type.array ?? false),
            default: defaultInfo.default,
            isAutoincrement: defaultInfo.isAutoincrement,
            isEnum: typeInfo.isEnum || undefined,
        });
    }
    const modelIdAttr = getAttribute(model, "@@id");
    const modelIdFields = getAttributeArrayRefs(modelIdAttr, "fields");
    const modelIdName = getAttributeStringArg(modelIdAttr, ["name", "map"]);
    const primaryKeyColumns = modelIdFields?.map((name) => fieldNameMap.get(name) ?? name) ?? [];
    const fieldIdColumns = model.fields
        .filter((field) => isDataField(field))
        .filter((field) => !!getAttribute(field, "@id"))
        .map((field) => getColumnName(field));
    const resolvedPrimaryKeyColumns = primaryKeyColumns.length > 0 ? primaryKeyColumns : fieldIdColumns;
    const primaryKey = resolvedPrimaryKeyColumns.length > 0
        ? {
            name: buildPrimaryKeyName(tableName, modelIdName),
            columns: resolvedPrimaryKeyColumns,
        }
        : undefined;
    const uniqueConstraints = [];
    const uniqueAttrs = model.attributes.filter((attr) => attr.decl.$refText === "@@unique");
    for (const attr of uniqueAttrs) {
        const columns = getAttributeArrayRefs(attr, "fields");
        if (!columns || columns.length === 0)
            continue;
        const resolvedColumns = columns.map((name) => fieldNameMap.get(name) ?? name);
        const explicitName = getAttributeStringArg(attr, ["name", "map"]);
        uniqueConstraints.push({
            name: buildUniqueName(tableName, resolvedColumns, explicitName),
            columns: resolvedColumns,
        });
    }
    for (const field of model.fields) {
        if (!isDataField(field))
            continue;
        if (!getAttribute(field, "@unique"))
            continue;
        const columnName = getColumnName(field);
        const constraintName = buildUniqueName(tableName, [columnName]);
        if (!uniqueConstraints.some((constraint) => constraint.name === constraintName)) {
            uniqueConstraints.push({ name: constraintName, columns: [columnName] });
        }
    }
    const indexes = [];
    const indexAttrs = model.attributes.filter((attr) => attr.decl.$refText === "@@index");
    for (const attr of indexAttrs) {
        const columns = getAttributeArrayRefs(attr, "fields");
        if (!columns || columns.length === 0)
            continue;
        const resolvedColumns = columns.map((name) => fieldNameMap.get(name) ?? name);
        const explicitName = getAttributeStringArg(attr, ["name", "map"]);
        indexes.push({
            name: buildIndexName(tableName, resolvedColumns, explicitName),
            columns: resolvedColumns,
        });
    }
    const foreignKeys = [];
    for (const field of model.fields) {
        if (!isDataField(field))
            continue;
        const relation = getRelationFieldNames(field);
        if (!relation)
            continue;
        const refModel = field.type.reference?.ref;
        if (!refModel || !isDataModel(refModel))
            continue;
        const referencedTable = getTableName(refModel);
        const referencedFieldMap = buildFieldNameMap(refModel);
        const referencedColumnNames = relation.references.map((name) => referencedFieldMap.get(name) ?? name);
        const columnNames = relation.fields.map((name) => fieldNameMap.get(name) ?? name);
        const fk = {
            name: buildForeignKeyName(tableName, columnNames, referencedTable, referencedColumnNames, relation.mapName),
            columns: columnNames,
            referencedTable,
            referencedColumns: referencedColumnNames,
        };
        if (relation.onDelete)
            fk.onDelete = relation.onDelete;
        if (relation.onUpdate)
            fk.onUpdate = relation.onUpdate;
        foreignKeys.push(fk);
    }
    const sortedColumns = columns.sort((a, b) => a.name.localeCompare(b.name));
    return {
        name: tableName,
        columns: sortedColumns,
        primaryKey,
        uniqueConstraints: uniqueConstraints.sort((a, b) => a.name.localeCompare(b.name)),
        indexes: indexes.sort((a, b) => a.name.localeCompare(b.name)),
        foreignKeys: foreignKeys.sort((a, b) => a.name.localeCompare(b.name)),
    };
}
function parseEnum(enumDecl) {
    const values = enumDecl.fields.map((field) => field.name);
    return {
        name: enumDecl.name,
        values,
    };
}
export async function generateSchemaSnapshot(schemaPath) {
    const loadResult = await loadDocument(schemaPath);
    if (!loadResult.success) {
        const messages = loadResult.errors.map((error) => String(error)).join("\n");
        throw new Error(`Failed to load schema:\n${messages}`);
    }
    const dataModels = loadResult.model.declarations.filter(isDataModel);
    const tables = dataModels
        .map((model) => parseModel(model))
        .sort((a, b) => a.name.localeCompare(b.name));
    const enumDecls = loadResult.model.declarations.filter(isEnum);
    const enums = enumDecls
        .map((enumDecl) => parseEnum(enumDecl))
        .sort((a, b) => a.name.localeCompare(b.name));
    return { tables, enums };
}
export function createSnapshot(schema) {
    return {
        version: 2,
        createdAt: new Date().toISOString(),
        schema,
    };
}
