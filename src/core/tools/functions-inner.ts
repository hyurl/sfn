import { __awaiter } from 'tslib';
import * as CallSiteRecord from "callsite-record";
import * as moment from "moment";
import * as fs from "fs-extra";
import chalk from "chalk";
import { Locale } from "./interfaces";
import { isTsNode, isDevMode } from "../../init";
import service from './Service';

const FileCache: { [filename: string]: string } = {};

export function isOwnMethod(obj: any, method: string): boolean {
    return typeof obj[method] === "function" &&
        (<Object>obj.constructor.prototype).hasOwnProperty(method);
}

export function moduleExists(name: string): boolean {
    return fs.existsSync(name + (isTsNode ? ".ts" : ".js"));
}

export function loadLanguagePack(filename: string): Locale {
    let mod = require(filename),
        lang: Locale;

    if (typeof mod.default === "object") {
        lang = mod.default;
    } else {
        lang = mod;
    }

    if (lang instanceof Array) {
        let _lang: Locale = {};
        for (let v of lang) {
            _lang[v] = v;
        }
        lang = _lang;
    }

    return lang;
}

export async function loadFile(filename, fromCache = false): Promise<string> {
    if (fromCache && FileCache[filename] !== undefined) {
        return FileCache[filename];
    } else {
        let content = await fs.readFile(filename, "utf8");

        fromCache && (FileCache[filename] = content);

        return content;
    }
}

export async function callsiteLog(err: Error) {
    var csr = CallSiteRecord({
        forError: err,
    });

    if (csr) {
        let str = await csr.render({});
        str = str.replace(/default_\d\./g, "default.");

        console.log();
        console.log(err.toString());
        console.log();
        console.log(str);
        console.log();
    }
}

export function createImport(require: Function): (id: string) => {
    [x: string]: any;
    default?: any
} {
    return (id: string) => {
        try {
            return require(id);
        } catch (err) {
            if (isDevMode) {
                callsiteLog(err);
            } else {
                let msg = err.toString(),
                    i = err.stack.indexOf("\n") + 1,
                    stack: string;

                stack = (err.stack.slice(i, err.stack.indexOf("\n", i))).trim();
                stack = stack.replace("_1", "").slice(3);

                process.nextTick(() => {
                    // Delay importing the Server module, allow configurations
                    // finish import before using them in service.
                    service.logger.hackTrace(stack);
                    service.logger.error(msg);
                });
            }

            return {};
        }
    };
}

export function getFuncParams(fn: Function) {
    let fnStr = fn.toString(),
        start = fnStr.indexOf("("),
        end = fnStr.indexOf(")"),
        paramStr = fnStr.slice(start + 1, end).trim(),
        params = paramStr.split(",").map(param => {
            return param.replace(/\s/g, "").split("=")[0];
        });

    return params;
}

function color(color: string, callSite: TemplateStringsArray, bindings: any[]): string {
    let msg = callSite.map((str, i) => {
        return i > 0 ? bindings[i - 1] + str : str;
    }).join("");
    return chalk[color](`[${moment().format("YYYY-MM-DDTHH:mm:ss")}]`) + " " + msg;
}

export function grey(callSite: TemplateStringsArray, ...bindings: any[]) {
    return color("grey", callSite, bindings);
}

export function green(callSite: TemplateStringsArray, ...bindings: any[]) {
    return color("green", callSite, bindings);
}

export function yellow(callSite: TemplateStringsArray, ...bindings: any[]) {
    return color("yellow", callSite, bindings);
}

export function red(callSite: TemplateStringsArray, ...bindings: any[]) {
    return color("red", callSite, bindings);
}