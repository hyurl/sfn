import * as CallSiteRecord from "callsite-record";
import * as moment from "moment";
import * as fs from "fs-extra";
import chalk from "chalk";
import { isTsNode, isDevMode } from "../../init";
import service from './Service';

export function isOwnMethod(obj: any, method: string): boolean {
    return typeof obj[method] === "function" &&
        (<Object>obj.constructor.prototype).hasOwnProperty(method);
}

export function moduleExists(name: string): boolean {
    return fs.existsSync(name + (isTsNode ? ".ts" : ".js"));
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