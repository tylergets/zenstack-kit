#!/usr/bin/env node
import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * zenstack-kit CLI - Database tooling for ZenStack schemas
 *
 * Commands:
 *   migrate create    Generate a new SQL migration
 *   migrate apply     Apply pending migrations
 *   migrate rehash    Rebuild migration log checksums from migration.sql files
 *   init              Initialize snapshot from existing schema
 *   pull              Introspect database and generate schema
 */
import { useState, useEffect } from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import SelectInput from "ink-select-input";
import { runMigrateGenerate, runMigrateApply, runMigrateRehash, runInit, runPull, CommandError, } from "./commands.js";
import { promptSnapshotExists, promptFreshInit, promptPullConfirm, promptTableRename, promptColumnRename, promptMigrationName, promptMigrationConfirm, } from "./prompts.js";
const commands = [
    { label: "migrate create", value: "migrate create", description: "Generate a new SQL migration file" },
    { label: "migrate apply", value: "migrate apply", description: "Apply pending SQL migrations" },
    { label: "migrate rehash", value: "migrate rehash", description: "Rebuild migration log checksums" },
    { label: "init", value: "init", description: "Initialize snapshot from existing schema" },
    { label: "pull", value: "pull", description: "Introspect database and generate schema" },
    { label: "help", value: "help", description: "Show help information" },
    { label: "exit", value: "exit", description: "Exit the CLI" },
];
// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    let command;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        // Handle "migrate create", "migrate apply", and "migrate rehash" subcommands
        if (arg === "migrate" && args[i + 1] === "create") {
            command = "migrate create";
            i++; // Skip the next argument
        }
        else if (arg === "migrate" && args[i + 1] === "apply") {
            command = "migrate apply";
            i++; // Skip the next argument
        }
        else if (arg === "migrate" && args[i + 1] === "rehash") {
            command = "migrate rehash";
            i++; // Skip the next argument
        }
        else if (arg === "init" || arg === "pull" || arg === "help") {
            command = arg;
        }
        else if (arg === "--name" || arg === "-n") {
            options.name = args[++i];
        }
        else if (arg === "--schema" || arg === "-s") {
            options.schema = args[++i];
        }
        else if (arg === "--migrations" || arg === "-m") {
            options.migrations = args[++i];
        }
        else if (arg === "--migration") {
            options.migration = args[++i];
        }
        else if (arg === "--no-ui") {
            options.noUi = true;
        }
        else if (arg === "--dialect") {
            options.dialect = args[++i];
        }
        else if (arg === "--url") {
            options.url = args[++i];
        }
        else if (arg === "--output" || arg === "-o") {
            options.output = args[++i];
        }
        else if (arg === "--table") {
            options.table = args[++i];
        }
        else if (arg === "--db-schema") {
            options.dbSchema = args[++i];
        }
        else if (arg === "--baseline") {
            options.baseline = true;
        }
        else if (arg === "--create-initial") {
            options.createInitial = true;
        }
        else if (arg === "--preview") {
            options.preview = true;
        }
        else if (arg === "--mark-applied") {
            options.markApplied = true;
        }
        else if (arg === "--strict") {
            options.strict = true;
        }
        else if (arg === "--ignore-order") {
            options.ignoreOrderMismatch = true;
        }
        else if (arg === "--empty") {
            options.empty = true;
        }
        else if (arg === "--update-snapshot") {
            options.updateSnapshot = true;
        }
        else if (arg === "--force" || arg === "-f") {
            options.force = true;
        }
        else if (arg === "--config" || arg === "-c") {
            options.config = args[++i];
        }
    }
    return { command, options };
}
// Status component for showing messages
function Status({ type, message }) {
    const colors = {
        info: "blue",
        success: "green",
        error: "red",
        warning: "yellow",
    };
    const symbols = {
        info: "ℹ",
        success: "✓",
        error: "✗",
        warning: "⚠",
    };
    return (_jsxs(Text, { color: colors[type], children: [symbols[type], " ", message] }));
}
// Help display component
function HelpDisplay() {
    return (_jsxs(Box, { flexDirection: "column", paddingY: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "zenstack-kit" }), _jsx(Text, { dimColor: true, children: "Database tooling for ZenStack schemas" }), _jsx(Text, { children: " " }), _jsx(Text, { bold: true, children: "Commands:" }), commands.filter(c => c.value !== "exit").map((cmd) => (_jsxs(Box, { marginLeft: 2, children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: "yellow", children: cmd.label }) }), _jsx(Text, { dimColor: true, children: cmd.description })] }, cmd.value))), _jsx(Text, { children: " " }), _jsx(Text, { bold: true, children: "Options:" }), _jsxs(Box, { marginLeft: 2, flexDirection: "column", children: [_jsx(Text, { dimColor: true, children: "-s, --schema <path>     Path to ZenStack schema" }), _jsx(Text, { dimColor: true, children: "-m, --migrations <path>  Migrations directory" }), _jsx(Text, { dimColor: true, children: "-n, --name <name>        Migration name" }), _jsx(Text, { dimColor: true, children: "--dialect <dialect>      Database dialect (sqlite, postgres, mysql)" }), _jsx(Text, { dimColor: true, children: "--url <url>              Database connection URL" }), _jsx(Text, { dimColor: true, children: "--migration <name>       Target a single migration (apply/rehash)" }), _jsx(Text, { dimColor: true, children: "--no-ui                   Disable Ink UI (useful for CI/non-TTY)" }), _jsx(Text, { dimColor: true, children: "--create-initial         Create initial migration (skip prompt)" }), _jsx(Text, { dimColor: true, children: "--baseline               Create baseline only (skip prompt)" }), _jsx(Text, { dimColor: true, children: "--empty                  Create an empty migration (no schema diff)" }), _jsx(Text, { dimColor: true, children: "--update-snapshot        Update snapshot when used with --empty" }), _jsx(Text, { dimColor: true, children: "--preview                Preview pending migrations without applying" }), _jsx(Text, { dimColor: true, children: "--mark-applied           Mark pending migrations as applied without running SQL" }), _jsx(Text, { dimColor: true, children: "--strict                 Enforce pending migration log checksums (no auto-rehash)" }), _jsx(Text, { dimColor: true, children: "-f, --force              Force operation without confirmation" }), _jsx(Text, { dimColor: true, children: "-c, --config <path>     Path to zenstack-kit config file" })] })] }));
}
function CliApp({ initialCommand, options }) {
    const { exit } = useApp();
    const [command, setCommand] = useState(initialCommand || null);
    const [phase, setPhase] = useState(initialCommand ? "running" : "select");
    const [migrationName, setMigrationName] = useState(options.name || null);
    const [logs, setLogs] = useState([]);
    const log = (type, message) => {
        setLogs((prev) => [...prev, { type, message }]);
    };
    // Handle command selection
    const handleSelect = (item) => {
        if (item.value === "exit") {
            exit();
            return;
        }
        if (item.value === "help") {
            setCommand("help");
            setPhase("done");
            return;
        }
        setCommand(item.value);
        // Always go to running - migration name prompt now happens after disambiguation
        setPhase("running");
    };
    // Execute commands
    useEffect(() => {
        if (phase !== "running" || !command)
            return;
        const run = async () => {
            const ctx = {
                cwd: process.cwd(),
                options: { ...options, name: migrationName || options.name },
                log,
                promptSnapshotExists: async () => {
                    const choice = await promptSnapshotExists();
                    return choice;
                },
                promptFreshInit: async () => {
                    const choice = await promptFreshInit();
                    return choice;
                },
                promptPullConfirm: async (existingFiles) => {
                    return await promptPullConfirm(existingFiles);
                },
                promptTableRename: async (from, to) => {
                    return await promptTableRename(from, to);
                },
                promptColumnRename: async (table, from, to) => {
                    return await promptColumnRename(table, from, to);
                },
                promptMigrationName: async (defaultName) => {
                    return await promptMigrationName(defaultName);
                },
                promptMigrationConfirm: async (migrationPath) => {
                    return await promptMigrationConfirm(migrationPath);
                },
            };
            try {
                if (command === "migrate create") {
                    await runMigrateGenerate(ctx);
                }
                else if (command === "migrate apply") {
                    await runMigrateApply(ctx);
                }
                else if (command === "migrate rehash") {
                    await runMigrateRehash(ctx);
                }
                else if (command === "init") {
                    await runInit(ctx);
                }
                else if (command === "pull") {
                    await runPull(ctx);
                }
            }
            catch (err) {
                if (err instanceof CommandError) {
                    log("error", err.message);
                }
                else {
                    log("error", `Error: ${err instanceof Error ? err.message : String(err)}`);
                }
            }
            setPhase("done");
        };
        run();
    }, [phase, command]);
    // Exit after command completes (for non-interactive mode, or on error)
    useEffect(() => {
        if (phase === "done" && command !== "help") {
            const hasError = logs.some((l) => l.type === "error");
            // Always exit on error, or exit in non-interactive mode
            if (hasError || initialCommand) {
                setTimeout(() => {
                    if (hasError) {
                        process.exitCode = 1;
                    }
                    exit();
                }, 100);
            }
        }
    }, [phase, initialCommand, logs, command, exit]);
    // Handle exit on 'q' or Escape in interactive mode
    useInput((input, key) => {
        if (phase === "done" && !initialCommand) {
            if (input === "q" || key.escape) {
                exit();
            }
            else if (key.return) {
                // Reset to command selection
                setCommand(null);
                setPhase("select");
                setLogs([]);
                setMigrationName(null);
            }
        }
    });
    return (_jsxs(Box, { flexDirection: "column", paddingY: 1, children: [phase === "select" && (_jsxs(_Fragment, { children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "zenstack-kit" }), _jsx(Text, { dimColor: true, children: " - Select a command" })] }), _jsx(SelectInput, { items: commands, onSelect: handleSelect })] })), command === "help" && _jsx(HelpDisplay, {}), logs.map((l, i) => (_jsx(Status, { type: l.type, message: l.message }, i))), phase === "done" && command !== "help" && !initialCommand && !logs.some((l) => l.type === "error") && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Press Enter to continue, 'q' or Escape to exit" }) }))] }));
}
function printHelpText() {
    const lines = [
        "zenstack-kit",
        "Database tooling for ZenStack schemas",
        "",
        "Commands:",
        "  migrate create   Generate a new SQL migration file",
        "  migrate apply    Apply pending SQL migrations",
        "  migrate rehash   Rebuild migration log checksums",
        "  init             Initialize snapshot from existing schema",
        "  pull             Introspect database and generate schema",
        "  help             Show help information",
        "",
        "Options:",
        "  -s, --schema <path>     Path to ZenStack schema",
        "  -m, --migrations <path> Migrations directory",
        "  -n, --name <name>       Migration name",
        "  --dialect <dialect>     Database dialect (sqlite, postgres, mysql)",
        "  --url <url>             Database connection URL",
        "  --migration <name>      Target a single migration (apply/rehash)",
        "  --no-ui                 Disable Ink UI (useful for CI/non-TTY)",
        "  --create-initial        Create initial migration (skip prompt)",
        "  --baseline              Create baseline only (skip prompt)",
        "  --empty                 Create an empty migration (no schema diff)",
        "  --update-snapshot       Update snapshot when used with --empty",
        "  --preview               Preview pending migrations without applying",
        "  --mark-applied          Mark pending migrations as applied without running SQL",
        "  --strict                Enforce pending migration log checksums (no auto-rehash)",
        "  -f, --force             Force operation without confirmation",
        "  -c, --config <path>     Path to zenstack-kit config file",
    ];
    console.log(lines.join("\n"));
}
async function runCommandDirect(command, options) {
    const log = (type, message) => {
        const prefix = type === "error" ? "✗" : type === "success" ? "✓" : type === "warning" ? "⚠" : "ℹ";
        const line = `${prefix} ${message}`;
        if (type === "error") {
            console.error(line);
        }
        else {
            console.log(line);
        }
    };
    const ctx = {
        cwd: process.cwd(),
        options,
        log,
    };
    try {
        if (command === "migrate create") {
            await runMigrateGenerate(ctx);
        }
        else if (command === "migrate apply") {
            await runMigrateApply(ctx);
        }
        else if (command === "migrate rehash") {
            await runMigrateRehash(ctx);
        }
        else if (command === "init") {
            await runInit(ctx);
        }
        else if (command === "pull") {
            await runPull(ctx);
        }
    }
    catch (err) {
        if (err instanceof CommandError) {
            log("error", err.message);
        }
        else {
            log("error", `Error: ${err instanceof Error ? err.message : String(err)}`);
        }
        process.exitCode = 1;
    }
}
// Entry point
export function runCli() {
    const { command, options } = parseArgs();
    const isInteractive = Boolean(process.stdout.isTTY) && !options.noUi;
    // Show version
    if (process.argv.includes("--version") || process.argv.includes("-v")) {
        console.log("0.1.0");
        process.exit(0);
    }
    // Show help if no command or --help/-h flag
    if (!command || process.argv.includes("--help") || process.argv.includes("-h")) {
        if (isInteractive) {
            const { waitUntilExit } = render(_jsx(HelpDisplay, {}));
            waitUntilExit().then(() => process.exit(0));
        }
        else {
            printHelpText();
        }
        return;
    }
    if (!isInteractive) {
        void runCommandDirect(command, options);
        return;
    }
    const { waitUntilExit } = render(_jsx(CliApp, { initialCommand: command, options: options }));
    waitUntilExit();
}
