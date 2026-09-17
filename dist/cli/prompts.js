import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Interactive prompts for the init command using ink
 */
import React, { useState } from "react";
import { render, Box, Text, useInput } from "ink";
import SelectInput from "ink-select-input";
function SelectPrompt({ message, items, onSelect }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const handleSelect = (item) => {
        onSelect(item.value);
    };
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: "cyan", children: "? " }), _jsx(Text, { children: message })] }), _jsx(SelectInput, { items: items, onSelect: handleSelect, onHighlight: (item) => {
                    const idx = items.findIndex((i) => i.value === item.value);
                    if (idx !== -1)
                        setSelectedIndex(idx);
                } }), items[selectedIndex]?.description && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["  ", items[selectedIndex].description] }) }))] }));
}
/**
 * Prompt user when snapshot already exists (Case A)
 */
export async function promptSnapshotExists() {
    return new Promise((resolve) => {
        const { unmount, waitUntilExit } = render(_jsx(SelectPrompt, { message: "Snapshot already exists. What would you like to do?", items: [
                {
                    label: "Skip",
                    value: "skip",
                    description: "Do nothing and exit",
                },
                {
                    label: "Reinitialize",
                    value: "reinitialize",
                    description: "Overwrite snapshot and rebuild migration log from existing migrations",
                },
            ], onSelect: (value) => {
                unmount();
                resolve(value);
            } }));
        waitUntilExit();
    });
}
/**
 * Prompt user for fresh init when no migrations exist (Case C)
 */
export async function promptFreshInit() {
    return new Promise((resolve) => {
        const { unmount, waitUntilExit } = render(_jsx(SelectPrompt, { message: "No migrations found. What would you like to do?", items: [
                {
                    label: "Baseline only",
                    value: "baseline",
                    description: "Create snapshot only - use when database already matches schema",
                },
                {
                    label: "Create initial migration",
                    value: "create_initial",
                    description: "Create snapshot + initial migration - use when database is empty",
                },
            ], onSelect: (value) => {
                unmount();
                resolve(value);
            } }));
        waitUntilExit();
    });
}
/**
 * Prompt user to confirm overwriting existing files during pull
 */
export async function promptPullConfirm(existingFiles) {
    return new Promise((resolve) => {
        const { unmount, waitUntilExit } = render(_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: "yellow", children: "\u26A0 " }), _jsx(Text, { children: "Existing files will be affected. Continue?" })] }), _jsx(SelectPrompt, { message: "", items: [
                        {
                            label: "No, abort",
                            value: "no",
                            description: "Cancel and keep existing files",
                        },
                        {
                            label: "Yes, continue",
                            value: "yes",
                            description: "Overwrite schema file (migrations will not be deleted)",
                        },
                    ], onSelect: (value) => {
                        unmount();
                        resolve(value === "yes");
                    } })] }));
        waitUntilExit();
    });
}
/**
 * Text input component for prompting user input
 */
function TextInputPrompt({ message, placeholder, onSubmit, }) {
    const [value, setValue] = React.useState("");
    const handleInput = (input, key) => {
        if (key.return) {
            onSubmit(value.trim() || placeholder);
        }
        else if (key.backspace || key.delete) {
            setValue((prev) => prev.slice(0, -1));
        }
        else if (!key.ctrl && !key.meta && input) {
            setValue((prev) => prev + input);
        }
    };
    useInput(handleInput);
    return (_jsx(Box, { flexDirection: "column", children: _jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: "? " }), _jsxs(Text, { children: [message, " "] }), _jsxs(Text, { dimColor: true, children: ["(", placeholder, "): "] }), _jsx(Text, { children: value }), _jsx(Text, { color: "gray", children: "\u2588" })] }) }));
}
/**
 * Prompt user for migration name
 */
export async function promptMigrationName(defaultName = "migration") {
    return new Promise((resolve) => {
        const { unmount, waitUntilExit } = render(_jsx(TextInputPrompt, { message: "Migration name", placeholder: defaultName, onSubmit: (value) => {
                unmount();
                resolve(value);
            } }));
        waitUntilExit();
    });
}
/**
 * Prompt user to confirm migration creation
 */
export async function promptMigrationConfirm(migrationPath) {
    return new Promise((resolve) => {
        const { unmount, waitUntilExit } = render(_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: "cyan", children: "? " }), _jsx(Text, { children: "Create migration at:" })] }), _jsx(Box, { marginBottom: 1, marginLeft: 2, children: _jsx(Text, { color: "yellow", children: migrationPath }) }), _jsx(SelectPrompt, { message: "", items: [
                        {
                            label: "Create migration",
                            value: "create",
                            description: "Generate the migration file",
                        },
                        {
                            label: "Cancel",
                            value: "cancel",
                            description: "Abort without creating migration",
                        },
                    ], onSelect: (value) => {
                        unmount();
                        resolve(value);
                    } })] }));
        waitUntilExit();
    });
}
/**
 * Prompt user to disambiguate a potential table rename
 */
export async function promptTableRename(from, to) {
    return new Promise((resolve) => {
        const { unmount, waitUntilExit } = render(_jsx(SelectPrompt, { message: `Table "${from}" was removed and "${to}" was added. Is this a rename?`, items: [
                {
                    label: `Rename "${from}" to "${to}"`,
                    value: "rename",
                    description: "Preserve data by renaming the table",
                },
                {
                    label: `Delete "${from}" and create "${to}"`,
                    value: "delete_create",
                    description: "Drop the old table and create a new one (data will be lost)",
                },
            ], onSelect: (value) => {
                unmount();
                resolve(value);
            } }));
        waitUntilExit();
    });
}
/**
 * Prompt user to disambiguate a potential column rename
 */
export async function promptColumnRename(table, from, to) {
    return new Promise((resolve) => {
        const { unmount, waitUntilExit } = render(_jsx(SelectPrompt, { message: `Column "${from}" was removed and "${to}" was added in table "${table}". Is this a rename?`, items: [
                {
                    label: `Rename "${from}" to "${to}"`,
                    value: "rename",
                    description: "Preserve data by renaming the column",
                },
                {
                    label: `Delete "${from}" and create "${to}"`,
                    value: "delete_create",
                    description: "Drop the old column and create a new one (data will be lost)",
                },
            ], onSelect: (value) => {
                unmount();
                resolve(value);
            } }));
        waitUntilExit();
    });
}
