/**
 * zenstack-kit - Drizzle-kit like CLI tooling for ZenStack schemas with Kysely support
 *
 * This package provides database migration and introspection utilities for ZenStack V3
 * schemas, generating Kysely-compatible type definitions and migration files.
 *
 * @packageDocumentation
 */
// Core functionality
export { introspectSchema } from "./schema/introspect.js";
export { createMigration, getSchemaDiff, hasSchemaChanges, initSnapshot, } from "./migrations/diff.js";
export { applyMigrations } from "./migrations/apply.js";
export { setPromptProvider } from "./cli/prompt-provider.js";
// Prisma-compatible migrations (default)
export { createPrismaMigration, createEmptyMigration, applyPrismaMigrations, previewPrismaMigrations, hasPrismaSchemaChanges, createInitialMigration, initializeSnapshot, hasSnapshot, scanMigrationFolders, readMigrationLog, writeMigrationLog, appendToMigrationLog, getMigrationLogPath, calculateChecksum, rehashWithSameVersion, detectPotentialRenames, } from "./migrations/prisma.js";
// High-level programmatic API
export { migrate } from "./migrate.js";
// CLI utilities
export { defineConfig } from "./config/index.js";
// Kysely integration
export { createKyselyAdapter, } from "./sql/kysely-adapter.js";
// Database pull (introspection)
export { pullSchema } from "./schema/pull.js";
