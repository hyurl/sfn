import * as path from "path";
import * as fs from "fs-extra";
import * as modelar from "modelar";
import { isTsNode } from "../../../init";
import { tryLogError, resolveErrorStack } from './error';
import get = require('lodash/get');
import { isSubClassOf } from '.';

const tryImport = createImport(require);

export function moduleExists(name: string): boolean {
    return fs.existsSync(name + (isTsNode ? ".ts" : ".js"));
}

export function createImport(require: Function): (id: string) => {
    [x: string]: any;
    default?: any
} {
    return (id: string) => {
        try {
            return require(id);
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

export function importUser() {
    let ctor: typeof modelar.User;

    try {
        ctor = get(app, "models.user").ctor;

        if (!ctor || !(isSubClassOf(ctor, modelar.User))) {
            ctor = modelar.User;
        }
    } catch (err) {
        ctor = modelar.User;
    }

    return ctor;
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