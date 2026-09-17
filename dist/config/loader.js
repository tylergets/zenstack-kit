/**
 * Configuration loader for zenstack-kit
 */
import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";
const CONFIG_FILES = [
    "zenstack-kit.config.ts",
    "zenstack-kit.config.js",
    "zenstack-kit.config.mjs",
    "zenstack-kit.config.cjs",
];
export async function loadConfig(cwd, configPath) {
    const resolvedConfigPath = configPath ? path.resolve(cwd, configPath) : null;
    const configPathToLoad = resolvedConfigPath ??
        CONFIG_FILES.map((file) => path.join(cwd, file)).find((file) => fs.existsSync(file));
    if (!configPathToLoad) {
        return null;
    }
    const ext = path.extname(configPathToLoad);
    let config;
    if (ext === ".cjs") {
        const require = createRequire(import.meta.url);
        const loaded = require(configPathToLoad);
        config = (loaded.default ?? loaded);
    }
    else if (ext === ".js" || ext === ".mjs") {
        const loaded = await import(pathToFileUrl(configPathToLoad));
        config = (loaded.default ?? loaded);
    }
    else {
        const { default: jiti } = await import("jiti");
        const loader = jiti(import.meta.url, { interopDefault: true });
        const loaded = loader(configPathToLoad);
        config = (loaded.default ?? loaded);
    }
    return {
        config,
        configPath: configPathToLoad,
        configDir: path.dirname(configPathToLoad),
    };
}
function pathToFileUrl(filePath) {
    const resolved = path.resolve(filePath);
    return new URL(`file://${resolved}`).href;
}
