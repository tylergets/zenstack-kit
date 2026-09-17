# Caller-supplied drivers

This fork supports custom Kysely dialects without importing the built-in database
drivers. The `dialect` string still selects SQL syntax and introspection behavior;
`kyselyDialect` selects the actual connection implementation.

```ts
import { defineConfig } from "zenstack-kit";
import { createApplicationDialect, executeApplicationSql } from "./database.js";

export default defineConfig({
  schema: "./schema.zmodel",
  dialect: "sqlite",
  dbCredentials: { file: "./app.db" },
  kyselyDialect: (options) => createApplicationDialect(options.databasePath),
  executeMigrationSql: (sql, db, dialect) => executeApplicationSql(sql, db, dialect),
});
```

The same options are accepted by `migrate` and `applyPrismaMigrations`.
`createKyselyAdapter`, `applyMigrations` (Kysely migrations), `pullSchema`, and
`previewPrismaMigrations` also accept `kyselyDialect`. CLI apply, preview, and pull
forward these options from the config file.

`kyselyDialect` may be a Kysely `Dialect` or a synchronous/asynchronous factory
receiving `KyselyAdapterOptions`. Prefer a factory in reusable configuration:
each invocation must return a fresh dialect/connection. zenstack-kit owns the
result and calls `Kysely.destroy()` in its cleanup path, including on failure.
Do not pass a dialect whose pool is shared with the running application.

## Whole SQL files

Kysely does not have a portable SQL-script API. Some drivers execute only the
first statement of a prepared query, so passing an entire migration to
`sql.raw()` is not a safe generic fallback.

When applying Prisma-style SQL migrations with `kyselyDialect`, supply
`executeMigrationSql(sqlContent, db, dialect)`. It receives the complete SQL file,
the active Kysely instance, and the **resolved** dialect (not the factory).
The callback must execute the complete script or throw, using the same database
as the supplied dialect. It owns any driver-specific script transaction handling
and must propagate failures. Do not split on semicolons: triggers and quoted
strings can contain them. Do not close the connection in this callback.

The migration runner records a successful migration only after the callback
returns. As with the built-in driver path, executing a SQL file and recording its
history are separate operations; this API does not add atomicity guarantees.
Preview and mark-applied do not require or call this executor.

When no custom dialect is supplied, the original built-in drivers remain
available for backward compatibility. This fork adds no dependency on
`node:sqlite` or any other replacement driver.
