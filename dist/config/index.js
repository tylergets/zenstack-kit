/**
 * Configuration utilities for zenstack-kit
 *
 * Provides a type-safe way to define configuration similar to drizzle-kit's config.
 */
/**
 * Define zenstack-kit configuration
 *
 * @example
 * ```ts
 * // zenstack-kit.config.ts
 * import { defineConfig } from "zenstack-kit";
 *
 * export default defineConfig({
 *   schema: "./prisma/schema.zmodel",
 *   out: "./src/db",
 *   dialect: "postgres",
 *   dbCredentials: {
 *     url: process.env.DATABASE_URL,
 *   },
 * });
 * ```
 */
export function defineConfig(config) {
    const dialect = config.dialect ?? "sqlite";
    const baseMigrations = {
        migrationsFolder: "./prisma/migrations",
        migrationsTable: "_prisma_migrations",
        ...config.migrations,
    };
    // Add migrationsSchema only for PostgreSQL
    const migrations = dialect === "postgres"
        ? { migrationsSchema: "public", ...baseMigrations }
        : baseMigrations;
    return {
        dialect,
        verbose: false,
        strict: false,
        ...config,
        out: config.out ?? "./generated",
        migrations,
        codegen: {
            camelCase: true,
            generateIndex: true,
            ...config.codegen,
        },
    };
}
