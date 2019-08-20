import * as path from "path";
import * as fs from "fs-extra";
import * as FRON from "fron";
import { isTsNode } from "../../../init";
import { tryLogError, resolveErrorStack } from './error';
import merge = require('lodash/merge');

const tryImport = createImport(require);

export function moduleExists(name: string): boolean {
    return fs.existsSync(name + (isTsNode ? ".ts" : ".js"));
}

export function createImport(require: NodeRequire): (id: string) => {
    [x: string]: any;
    default?: any
} {
    return (id: string) => {
        try {
            let filename = require.resolve(id);

            // Support JSONC (JSON with comment) files.
            if ([".json", ".jsonc"].includes(path.extname(filename))) {
                return FRON.parse(fs.readFileSync(filename, "utf8"));
            } else {
                return require(id);
            }
        } catch (err) {
            err.stack = resolveErrorStack(err.stack, null, 1).stack;
            tryLogError(err);
            return {};
        }
    };
}

export function traceModulePath(baseDir: string) {
    let target = { stack: "" };

    Error.captureStackTrace(target);

    let { filename } = resolveErrorStack(target.stack, baseDir);
    let ext: string;

    if (!filename)
        return;

    if (ext = path.extname(filename)) {
        filename = filename.slice(0, -ext.length);
    }

    return filename;
}

export async function importDirectory(dir: string) {
    var ext = isTsNode ? ".ts" : ".js";
    var files = await fs.readdir(dir);

    for (let file of files) {
        let filename = path.resolve(dir, file);
        let stat = await fs.stat(filename);

        if (stat.isFile() && path.extname(file) == ext) {
            tryImport(filename);
        } else if (stat.isDirectory()) {
            // load files recursively.
            await importDirectory(filename);
        }
    }
}

export function bootstrap() {
    let moduleName = app.APP_PATH + "/config";
    let tryImport = createImport(require);
    let config = require("../../../config");

    if (!app.isCli) {
        // Load user-defined bootstrap procedures.
        let bootstrap = app.APP_PATH + "/bootstrap/index";

        moduleExists(bootstrap) && tryImport(bootstrap);

        // load hooks
        fs.pathExists(app.hooks.path).then(async (exists) => {
            exists && (await importDirectory(app.hooks.path));
        });
    }

    if (moduleExists(moduleName)) {
        // Load user-defined configurations.
        let mod = tryImport(moduleName);

        if (!Object.is(mod, config) && typeof mod.default == "object") {
            merge(config.default, mod.default);
        }
    }
}