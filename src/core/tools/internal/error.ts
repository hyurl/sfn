import * as path from "path";
import * as callSiteRecord from "callsite-record";
import startsWith = require('lodash/startsWith');
import { isDevMode, APP_PATH, SRC_PATH } from "../../../init";
import { StatusException } from "../StatusException";
import { red } from './color';

const StackLine = /\((.+?):(\d+):(\d+)\)$|at\s+(.+?):(\d+):(\d+)$/;

function findAbsoluteFilename(stack: string, baseDir?: string) {
    let matches = StackLine.exec(stack);

    if (matches) {
        let filename = (matches[1] || matches[4]).replace(SRC_PATH, APP_PATH);

        if (path.isAbsolute(filename) &&
            (!baseDir || startsWith(filename, baseDir))
        ) {
            return filename;
        }
    }

    return void 0;
};

export function resolveErrorStack(stack: string, baseDir?: string, offset = 0): {
    filename: string,
    stack: string
} {
    let lines = stack.split("\n");
    let header = lines.splice(0, 1);
    let filename: string;
    let index = 0;

    for (let i = 0; i < lines.length; i++) {
        if (filename = findAbsoluteFilename(lines[i], baseDir)) {
            index = i;

            if (offset) {
                let _filename = findAbsoluteFilename(lines[index + offset]);

                if (_filename) {
                    index += offset;
                    filename = _filename;
                }
            }

            break;
        }
    }

    return {
        filename,
        stack: header.concat(lines.slice(index)).join("\n")
    };
}

export async function tryLogError(err: any, stack?: string) {
    // Do not log http errors except they are server-side errors. 
    if (err instanceof StatusException && err.code < 500) {
        return;
    } else if (err instanceof Error) {
        err.stack = err.stack.replace(/default_\d\./g, "default.");
    }

    if (isDevMode && err instanceof Error) {
        let csr = callSiteRecord({
            forError: err,
        });

        if (csr) {
            try {
                let str = await csr.render({});

                console.error();
                console.error(err.toString());
                console.error();
                console.error(str);
                console.error();
            } catch (e) {
                console.error(err);
            }
        }
    } else {
        if (!(err instanceof Error)) {
            stack = err;
        }

        if (stack) {
            console.error(red`${String(err)} ${stack}`);
        } else {
            console.error(red`${(<Error>err).stack}`);
        }
    }
}