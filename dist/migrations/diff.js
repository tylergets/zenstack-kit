/**
 * Migration generation and management
 *
 * Creates and manages database migrations based on ZenStack schema changes
 * using AST-based diffs and Kysely schema builder operations.
 */
import * as fs from "fs/promises";
import * as path from "path";
import { createSnapshot, generateSchemaSnapshot, } from "../schema/snapshot.js";
function getSnapshotPaths(outputPath, snapshotPath) {
    if (snapshotPath) {
        return {
            metaDir: path.dirname(snapshotPath),
            snapshotPath,
        };
    }
    const metaDir = path.join(outputPath, "meta");
    return {
        metaDir,
        snapshotPath: path.join(metaDir, "_snapshot.json"),
    };
}
async function readSnapshot(snapshotPath) {
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
async function writeSnapshot(snapshotPath, schema) {
    const snapshot = createSnapshot(schema);
    await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), "utf-8");
}
function buildColumnBuilder(field) {
    const parts = [];
    if (field.notNull) {
        parts.push("notNull()");
    }
    if (field.default !== undefined) {
        parts.push(`defaultTo(${formatLiteral(field.default)})`);
    }
    if (parts.length === 0) {
        return null;
    }
    return `(col) => col.${parts.join(".")}`;
}
function formatLiteral(value) {
    if (typeof value === "string") {
        return JSON.stringify(value);
    }
    return String(value);
}
function buildCreateTable(model) {
    const tableName = model.name;
    const columns = model.columns.map((field) => {
        const columnName = field.name;
        const columnType = field.type;
        const builder = buildColumnBuilder(field);
        if (builder) {
            return `.addColumn('${columnName}', '${columnType}', ${builder})`;
        }
        return `.addColumn('${columnName}', '${columnType}')`;
    });
    const constraints = [];
    if (model.primaryKey) {
        constraints.push(`.addPrimaryKeyConstraint('${model.primaryKey.name}', ${JSON.stringify(model.primaryKey.columns)})`);
    }
    for (const unique of model.uniqueConstraints) {
        constraints.push(`.addUniqueConstraint('${unique.name}', ${JSON.stringify(unique.columns)})`);
    }
    for (const foreignKey of model.foreignKeys) {
        constraints.push(`.addForeignKeyConstraint('${foreignKey.name}', ${JSON.stringify(foreignKey.columns)}, '${foreignKey.referencedTable}', ${JSON.stringify(foreignKey.referencedColumns)})`);
    }
    const statements = [
        `await db.schema.createTable('${tableName}')`,
        ...columns,
        ...constraints,
        ".execute();",
    ];
    for (const index of model.indexes) {
        statements.push(buildCreateIndex(tableName, index.name, index.columns));
    }
    return statements.join("\n\n");
}
function buildDropTable(model) {
    const tableName = model.name;
    return `await db.schema.dropTable('${tableName}').ifExists().execute();`;
}
function buildAddColumn(model, field) {
    const tableName = model.name;
    const columnName = field.name;
    const columnType = field.type;
    const builder = buildColumnBuilder(field);
    if (builder) {
        return [
            `await db.schema.alterTable('${tableName}')`,
            `.addColumn('${columnName}', '${columnType}', ${builder})`,
            ".execute();",
        ].join("\n");
    }
    return [
        `await db.schema.alterTable('${tableName}')`,
        `.addColumn('${columnName}', '${columnType}')`,
        ".execute();",
    ].join("\n");
}
function buildDropColumn(model, field) {
    const tableName = model.name;
    const columnName = field.name;
    return `await db.schema.alterTable('${tableName}').dropColumn('${columnName}').execute();`;
}
function buildAddPrimaryKeyConstraint(tableName, name, columns) {
    return [
        `await db.schema.alterTable('${tableName}')`,
        `.addPrimaryKeyConstraint('${name}', ${JSON.stringify(columns)})`,
        ".execute();",
    ].join("\n");
}
function buildAddUniqueConstraint(tableName, name, columns) {
    return [
        `await db.schema.alterTable('${tableName}')`,
        `.addUniqueConstraint('${name}', ${JSON.stringify(columns)})`,
        ".execute();",
    ].join("\n");
}
function buildDropConstraint(tableName, name) {
    return `await db.schema.alterTable('${tableName}').dropConstraint('${name}').execute();`;
}
function buildCreateIndex(tableName, name, columns) {
    const statement = [
        `await db.schema.createIndex('${name}')`,
        `.on('${tableName}')`,
        ...columns.map((column) => `.column('${column}')`),
        ".execute();",
    ];
    return statement.join("\n");
}
function buildDropIndex(name) {
    return `await db.schema.dropIndex('${name}').execute();`;
}
function buildAddForeignKeyConstraint(tableName, name, columns, referencedTable, referencedColumns) {
    return [
        `await db.schema.alterTable('${tableName}')`,
        `.addForeignKeyConstraint('${name}', ${JSON.stringify(columns)}, '${referencedTable}', ${JSON.stringify(referencedColumns)})`,
        ".execute();",
    ].join("\n");
}
function buildAlterColumnChanges(change) {
    const upStatements = [];
    const downStatements = [];
    const tableName = change.tableName;
    const columnName = change.columnName;
    if (change.changes.typeChanged || change.changes.listChanged) {
        const upType = change.current.type;
        const downType = change.previous.type;
        upStatements.push(`await db.schema.alterTable('${tableName}').alterColumn('${columnName}', (ac) => ac.setDataType('${upType}')).execute();`);
        downStatements.push(`await db.schema.alterTable('${tableName}').alterColumn('${columnName}', (ac) => ac.setDataType('${downType}')).execute();`);
    }
    if (change.changes.requiredChanged) {
        if (change.current.notNull) {
            upStatements.push(`await db.schema.alterTable('${tableName}').alterColumn('${columnName}', (ac) => ac.setNotNull()).execute();`);
            downStatements.push(`await db.schema.alterTable('${tableName}').alterColumn('${columnName}', (ac) => ac.dropNotNull()).execute();`);
        }
        else {
            upStatements.push(`await db.schema.alterTable('${tableName}').alterColumn('${columnName}', (ac) => ac.dropNotNull()).execute();`);
            downStatements.push(`await db.schema.alterTable('${tableName}').alterColumn('${columnName}', (ac) => ac.setNotNull()).execute();`);
        }
    }
    if (change.changes.defaultChanged) {
        if (change.current.default !== undefined) {
            upStatements.push(`await db.schema.alterTable('${tableName}').alterColumn('${columnName}', (ac) => ac.setDefault(${formatLiteral(change.current.default)})).execute();`);
        }
        else {
            upStatements.push(`await db.schema.alterTable('${tableName}').alterColumn('${columnName}', (ac) => ac.dropDefault()).execute();`);
        }
        if (change.previous.default !== undefined) {
            downStatements.push(`await db.schema.alterTable('${tableName}').alterColumn('${columnName}', (ac) => ac.setDefault(${formatLiteral(change.previous.default)})).execute();`);
        }
        else {
            downStatements.push(`await db.schema.alterTable('${tableName}').alterColumn('${columnName}', (ac) => ac.dropDefault()).execute();`);
        }
    }
    return { up: upStatements, down: downStatements };
}
function diffSchemas(previous, current) {
    const previousModels = new Map();
    const currentModels = new Map();
    previous?.tables.forEach((model) => previousModels.set(model.name, model));
    current.tables.forEach((model) => currentModels.set(model.name, model));
    const addedModels = [];
    const removedModels = [];
    const addedFields = [];
    const removedFields = [];
    const alteredFields = [];
    const addedUniqueConstraints = [];
    const removedUniqueConstraints = [];
    const addedIndexes = [];
    const removedIndexes = [];
    const addedForeignKeys = [];
    const removedForeignKeys = [];
    const primaryKeyChanges = [];
    const renamedTables = [];
    const renamedColumns = [];
    for (const [tableName, model] of currentModels.entries()) {
        if (!previousModels.has(tableName)) {
            addedModels.push(model);
        }
    }
    for (const [tableName, model] of previousModels.entries()) {
        if (!currentModels.has(tableName)) {
            removedModels.push(model);
        }
    }
    for (const [tableName, currentModel] of currentModels.entries()) {
        const previousModel = previousModels.get(tableName);
        if (!previousModel) {
            continue;
        }
        const modelDiff = diffModelChanges(previousModel, currentModel, tableName);
        addedFields.push(...modelDiff.addedFields);
        removedFields.push(...modelDiff.removedFields);
        alteredFields.push(...modelDiff.alteredFields);
        addedUniqueConstraints.push(...modelDiff.addedUniqueConstraints);
        removedUniqueConstraints.push(...modelDiff.removedUniqueConstraints);
        addedIndexes.push(...modelDiff.addedIndexes);
        removedIndexes.push(...modelDiff.removedIndexes);
        addedForeignKeys.push(...modelDiff.addedForeignKeys);
        removedForeignKeys.push(...modelDiff.removedForeignKeys);
        primaryKeyChanges.push(...modelDiff.primaryKeyChanges);
    }
    return {
        addedModels,
        removedModels,
        addedFields,
        removedFields,
        alteredFields,
        renamedTables,
        renamedColumns,
        addedUniqueConstraints,
        removedUniqueConstraints,
        addedIndexes,
        removedIndexes,
        addedForeignKeys,
        removedForeignKeys,
        primaryKeyChanges,
    };
}
function diffModelChanges(previousModel, currentModel, tableName) {
    const addedFields = [];
    const removedFields = [];
    const alteredFields = [];
    const addedUniqueConstraints = [];
    const removedUniqueConstraints = [];
    const addedIndexes = [];
    const removedIndexes = [];
    const addedForeignKeys = [];
    const removedForeignKeys = [];
    const primaryKeyChanges = [];
    const previousFields = new Map();
    const currentFields = new Map();
    previousModel.columns.forEach((field) => previousFields.set(field.name, field));
    currentModel.columns.forEach((field) => currentFields.set(field.name, field));
    for (const [columnName, field] of currentFields.entries()) {
        if (!previousFields.has(columnName)) {
            addedFields.push({ model: currentModel, tableName, field, columnName });
        }
    }
    for (const [columnName, field] of previousFields.entries()) {
        if (!currentFields.has(columnName)) {
            removedFields.push({ model: previousModel, tableName, field, columnName });
        }
    }
    for (const [columnName, currentField] of currentFields.entries()) {
        const previousField = previousFields.get(columnName);
        if (!previousField) {
            continue;
        }
        const typeChanged = previousField.type !== currentField.type;
        const requiredChanged = previousField.notNull !== currentField.notNull;
        const defaultChanged = previousField.default !== currentField.default;
        const listChanged = previousField.isArray !== currentField.isArray;
        if (typeChanged || requiredChanged || defaultChanged || listChanged) {
            alteredFields.push({
                model: currentModel,
                tableName,
                columnName,
                previous: previousField,
                current: currentField,
                changes: {
                    typeChanged,
                    requiredChanged,
                    defaultChanged,
                    listChanged,
                },
            });
        }
    }
    const previousPk = previousModel.primaryKey;
    const currentPk = currentModel.primaryKey;
    const pkEqual = (previousPk?.name ?? "") === (currentPk?.name ?? "") &&
        JSON.stringify(previousPk?.columns ?? []) === JSON.stringify(currentPk?.columns ?? []);
    if (!pkEqual) {
        primaryKeyChanges.push({
            tableName,
            previous: previousPk,
            current: currentPk,
        });
    }
    const previousUniqueMap = new Map(previousModel.uniqueConstraints.map((constraint) => [constraint.name, constraint]));
    const currentUniqueMap = new Map(currentModel.uniqueConstraints.map((constraint) => [constraint.name, constraint]));
    for (const [name, constraint] of currentUniqueMap.entries()) {
        if (!previousUniqueMap.has(name)) {
            addedUniqueConstraints.push({ tableName, constraint });
        }
    }
    for (const [name, constraint] of previousUniqueMap.entries()) {
        if (!currentUniqueMap.has(name)) {
            removedUniqueConstraints.push({ tableName, constraint });
        }
    }
    const previousIndexMap = new Map(previousModel.indexes.map((index) => [index.name, index]));
    const currentIndexMap = new Map(currentModel.indexes.map((index) => [index.name, index]));
    for (const [name, index] of currentIndexMap.entries()) {
        if (!previousIndexMap.has(name)) {
            addedIndexes.push({ tableName, index });
        }
    }
    for (const [name, index] of previousIndexMap.entries()) {
        if (!currentIndexMap.has(name)) {
            removedIndexes.push({ tableName, index });
        }
    }
    const previousFkMap = new Map(previousModel.foreignKeys.map((foreignKey) => [foreignKey.name, foreignKey]));
    const currentFkMap = new Map(currentModel.foreignKeys.map((foreignKey) => [foreignKey.name, foreignKey]));
    for (const [name, foreignKey] of currentFkMap.entries()) {
        if (!previousFkMap.has(name)) {
            addedForeignKeys.push({ tableName, foreignKey });
        }
    }
    for (const [name, foreignKey] of previousFkMap.entries()) {
        if (!currentFkMap.has(name)) {
            removedForeignKeys.push({ tableName, foreignKey });
        }
    }
    return {
        addedFields,
        removedFields,
        alteredFields,
        addedUniqueConstraints,
        removedUniqueConstraints,
        addedIndexes,
        removedIndexes,
        addedForeignKeys,
        removedForeignKeys,
        primaryKeyChanges,
    };
}
function applyRenameMappings(diff, renameTables = [], renameColumns = []) {
    const removedModels = [...diff.removedModels];
    const addedModels = [...diff.addedModels];
    const removedFields = [...diff.removedFields];
    const addedFields = [...diff.addedFields];
    const alteredFields = [...diff.alteredFields];
    const addedUniqueConstraints = [...diff.addedUniqueConstraints];
    const removedUniqueConstraints = [...diff.removedUniqueConstraints];
    const addedIndexes = [...diff.addedIndexes];
    const removedIndexes = [...diff.removedIndexes];
    const addedForeignKeys = [...diff.addedForeignKeys];
    const removedForeignKeys = [...diff.removedForeignKeys];
    const primaryKeyChanges = [...diff.primaryKeyChanges];
    const renamedTables = [];
    const renamedColumns = [];
    const renamedTableMap = new Map();
    renameTables.forEach((mapping) => {
        const fromIndex = removedModels.findIndex((model) => model.name === mapping.from);
        const toIndex = addedModels.findIndex((model) => model.name === mapping.to);
        if (fromIndex === -1 || toIndex === -1) {
            return;
        }
        const previousModel = removedModels[fromIndex];
        const currentModel = addedModels[toIndex];
        removedModels.splice(fromIndex, 1);
        addedModels.splice(toIndex, 1);
        renamedTables.push({ from: mapping.from, to: mapping.to });
        renamedTableMap.set(mapping.from, mapping.to);
        const modelDiff = diffModelChanges(previousModel, currentModel, mapping.to);
        addedFields.push(...modelDiff.addedFields);
        removedFields.push(...modelDiff.removedFields);
        alteredFields.push(...modelDiff.alteredFields);
        addedUniqueConstraints.push(...modelDiff.addedUniqueConstraints);
        removedUniqueConstraints.push(...modelDiff.removedUniqueConstraints);
        addedIndexes.push(...modelDiff.addedIndexes);
        removedIndexes.push(...modelDiff.removedIndexes);
        addedForeignKeys.push(...modelDiff.addedForeignKeys);
        removedForeignKeys.push(...modelDiff.removedForeignKeys);
        primaryKeyChanges.push(...modelDiff.primaryKeyChanges);
    });
    if (renamedTableMap.size > 0) {
        removedFields.forEach((entry) => {
            const mapped = renamedTableMap.get(entry.tableName);
            if (mapped) {
                entry.tableName = mapped;
            }
        });
    }
    const remapTableName = (tableName) => renamedTableMap.get(tableName) ?? tableName;
    const remapTableEntries = (items) => items.map((item) => ({ ...item, tableName: remapTableName(item.tableName) }));
    renameColumns.forEach((mapping) => {
        const fromIndex = removedFields.findIndex((entry) => entry.tableName === mapping.table && entry.columnName === mapping.from);
        const toIndex = addedFields.findIndex((entry) => entry.tableName === mapping.table && entry.columnName === mapping.to);
        if (fromIndex === -1 || toIndex === -1) {
            return;
        }
        removedFields.splice(fromIndex, 1);
        addedFields.splice(toIndex, 1);
        renamedColumns.push({ tableName: mapping.table, from: mapping.from, to: mapping.to });
    });
    return {
        ...diff,
        removedModels,
        addedModels,
        removedFields,
        addedFields,
        alteredFields,
        renamedTables,
        renamedColumns,
        addedUniqueConstraints: remapTableEntries(addedUniqueConstraints),
        removedUniqueConstraints: remapTableEntries(removedUniqueConstraints),
        addedIndexes: remapTableEntries(addedIndexes),
        removedIndexes: remapTableEntries(removedIndexes),
        addedForeignKeys: remapTableEntries(addedForeignKeys),
        removedForeignKeys: remapTableEntries(removedForeignKeys),
        primaryKeyChanges: remapTableEntries(primaryKeyChanges),
    };
}
function buildMigrationPlan(diff) {
    const upStatements = [];
    const downStatements = [];
    diff.renamedTables.forEach((rename) => {
        upStatements.push(`await db.schema.alterTable('${rename.from}').renameTo('${rename.to}').execute();`);
        downStatements.unshift(`await db.schema.alterTable('${rename.to}').renameTo('${rename.from}').execute();`);
    });
    diff.renamedColumns.forEach((rename) => {
        upStatements.push(`await db.schema.alterTable('${rename.tableName}').renameColumn('${rename.from}', '${rename.to}').execute();`);
        downStatements.unshift(`await db.schema.alterTable('${rename.tableName}').renameColumn('${rename.to}', '${rename.from}').execute();`);
    });
    diff.addedModels.forEach((model) => {
        upStatements.push(buildCreateTable(model));
        downStatements.unshift(buildDropTable(model));
    });
    diff.removedModels.forEach((model) => {
        upStatements.push(buildDropTable(model));
        downStatements.unshift(buildCreateTable(model));
    });
    diff.primaryKeyChanges.forEach((change) => {
        if (change.previous) {
            upStatements.push(buildDropConstraint(change.tableName, change.previous.name));
            downStatements.unshift(buildAddPrimaryKeyConstraint(change.tableName, change.previous.name, change.previous.columns));
        }
    });
    diff.removedForeignKeys.forEach(({ tableName, foreignKey }) => {
        upStatements.push(buildDropConstraint(tableName, foreignKey.name));
        downStatements.unshift(buildAddForeignKeyConstraint(tableName, foreignKey.name, foreignKey.columns, foreignKey.referencedTable, foreignKey.referencedColumns));
    });
    diff.removedUniqueConstraints.forEach(({ tableName, constraint }) => {
        upStatements.push(buildDropConstraint(tableName, constraint.name));
        downStatements.unshift(buildAddUniqueConstraint(tableName, constraint.name, constraint.columns));
    });
    diff.removedIndexes.forEach(({ tableName, index }) => {
        upStatements.push(buildDropIndex(index.name));
        downStatements.unshift(buildCreateIndex(tableName, index.name, index.columns));
    });
    diff.addedFields.forEach(({ model, field }) => {
        upStatements.push(buildAddColumn(model, field));
        downStatements.unshift(buildDropColumn(model, field));
    });
    diff.removedFields.forEach(({ model, field }) => {
        upStatements.push(buildDropColumn(model, field));
        downStatements.unshift(buildAddColumn(model, field));
    });
    diff.alteredFields.forEach((change) => {
        const alterations = buildAlterColumnChanges(change);
        upStatements.push(...alterations.up);
        downStatements.unshift(...alterations.down);
    });
    diff.primaryKeyChanges.forEach((change) => {
        if (change.current) {
            upStatements.push(buildAddPrimaryKeyConstraint(change.tableName, change.current.name, change.current.columns));
            downStatements.unshift(buildDropConstraint(change.tableName, change.current.name));
        }
    });
    diff.addedUniqueConstraints.forEach(({ tableName, constraint }) => {
        upStatements.push(buildAddUniqueConstraint(tableName, constraint.name, constraint.columns));
        downStatements.unshift(buildDropConstraint(tableName, constraint.name));
    });
    diff.addedIndexes.forEach(({ tableName, index }) => {
        upStatements.push(buildCreateIndex(tableName, index.name, index.columns));
        downStatements.unshift(buildDropIndex(index.name));
    });
    diff.addedForeignKeys.forEach(({ tableName, foreignKey }) => {
        upStatements.push(buildAddForeignKeyConstraint(tableName, foreignKey.name, foreignKey.columns, foreignKey.referencedTable, foreignKey.referencedColumns));
        downStatements.unshift(buildDropConstraint(tableName, foreignKey.name));
    });
    return { upStatements, downStatements };
}
function generateTimestamp() {
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
function formatStatements(statements) {
    if (statements.length === 0) {
        return "  // No schema changes detected";
    }
    return statements.map((statement) => indentLines(statement, 2)).join("\n\n");
}
function indentLines(text, spaces) {
    const indent = " ".repeat(spaces);
    return text
        .split("\n")
        .map((line) => `${indent}${line}`)
        .join("\n");
}
export async function getSchemaDiff(options) {
    const currentSchema = await generateSchemaSnapshot(options.schemaPath);
    const { snapshotPath } = getSnapshotPaths(options.outputPath, options.snapshotPath);
    const previousSnapshot = await readSnapshot(snapshotPath);
    return applyRenameMappings(diffSchemas(previousSnapshot?.schema ?? null, currentSchema), options.renameTables, options.renameColumns);
}
export async function hasSchemaChanges(options) {
    const diff = await getSchemaDiff(options);
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
        diff.primaryKeyChanges.length > 0 ||
        diff.renamedTables.length > 0 ||
        diff.renamedColumns.length > 0);
}
/**
 * Initialize a snapshot from the current schema without generating a migration.
 * Use this to baseline an existing database before starting to track migrations.
 */
export async function initSnapshot(options) {
    const currentSchema = await generateSchemaSnapshot(options.schemaPath);
    const { snapshotPath } = getSnapshotPaths(options.outputPath, options.snapshotPath);
    await writeSnapshot(snapshotPath, currentSchema);
    return {
        snapshotPath,
        tableCount: currentSchema.tables.length,
    };
}
/**
 * Create a migration file from schema changes
 */
export async function createMigration(options) {
    if (!options.name) {
        throw new Error("Migration name is required");
    }
    const currentSchema = await generateSchemaSnapshot(options.schemaPath);
    const { snapshotPath } = getSnapshotPaths(options.outputPath, options.snapshotPath);
    const previousSnapshot = await readSnapshot(snapshotPath);
    const diff = applyRenameMappings(diffSchemas(previousSnapshot?.schema ?? null, currentSchema), options.renameTables, options.renameColumns);
    const plan = buildMigrationPlan(diff);
    if (plan.upStatements.length === 0) {
        return null;
    }
    const timestamp = Date.now();
    const timestampStr = generateTimestamp();
    const safeName = options.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `${timestampStr}_${safeName}.ts`;
    const upContent = formatStatements(plan.upStatements);
    const downContent = formatStatements(plan.downStatements);
    const content = `// Migration: ${options.name}
// Generated at: ${new Date(timestamp).toISOString()}

import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
${upContent}
}

export async function down(db: Kysely<any>): Promise<void> {
${downContent}
}
`;
    await fs.mkdir(options.outputPath, { recursive: true });
    const outputFile = path.join(options.outputPath, filename);
    await fs.writeFile(outputFile, content, "utf-8");
    await writeSnapshot(snapshotPath, currentSchema);
    return {
        filename,
        up: plan.upStatements.join("\n\n"),
        down: plan.downStatements.join("\n\n"),
        timestamp,
    };
}
