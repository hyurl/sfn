import { extname, basename } from "path";
import { __awaiter } from 'tslib';
import * as CallSiteRecord from "callsite-record";
import * as moment from "moment";
import * as fs from "fs";
import chalk from "chalk";
import { Locale } from "./interfaces";
import { Service } from './Service';
import { isTsNode, isDevMode } from "../../init";

export function moduleExists(name: string): boolean {
    return fs.existsSync(name + (isTsNode ? ".ts" : ".js"));
}

export function loadLanguagePack(filename: string): Locale {
    let ext = extname(filename),
        name = basename(filename, ext).replace(/\-/g, ""),
        _module = require(filename),
        lang: Locale;

    if (typeof _module[name] === "object") {
        lang = _module[name];
    } else if (typeof _module.default === "object") {
        lang = _module.default;
    } else {
        lang = _module;
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

let logService: Service;

export function createImport(require: Function) {
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
                    if (!logService) {
                        logService = new (require("./Service").Service);
                    }

                    logService.logger.hackTrace(stack);
                    logService.logger.error(msg);
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