export interface PotentialTableRename {
    from: string;
    to: string;
}
export interface PotentialColumnRename {
    table: string;
    from: string;
    to: string;
}
export interface PotentialRenames {
    tables: PotentialTableRename[];
    columns: PotentialColumnRename[];
}
/**
 * Detect potential renames by finding removed+added pairs.
 * A table rename is detected when one table is removed and one is added.
 * A column rename is detected when within the same table, one column is removed and one is added.
 */
export declare function detectPotentialRenames(options: {
    schemaPath: string;
    outputPath: string;
}): Promise<PotentialRenames>;
//# sourceMappingURL=rename.d.ts.map