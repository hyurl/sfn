import { extname, basename } from "path";
import { __awaiter } from 'tslib';
import * as CallSiteRecord from "callsite-record";
import { Locale } from "./interfaces";
import { Controller } from "../controllers/Controller";
import { HttpController } from "../controllers/HttpController";
import { WebSocketController } from "../controllers/WebSocketController";
import { RouteMap } from "./RouteMap";
import { EventMap } from "./EventMap";
import { config } from "../bootstrap/ConfigLoader";
import { ControllerFilter } from './functions';

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

const docre = /\/\*\*[\s\S]*?\*\/$/mg;
const methodre = /^([a-zA-Z0-9_]+)\s*\(|^(async|\*)\s+([a-zA-Z0-9_]+)\s*\(/;
const routere = /@route\s+([A-Z]+\s+\S+)\s*([\r\n]|\*\/)/;
const eventre = /@event\s+(.*)([\r\n]|\*\/)/;
const uploadre = /@upload\s+(.*)([\r\n]|\*\/)/;
const requireAuthRe = /@requireAuth\s*([\r\n]|\*\/)/;

export type MethodDocMeta = {
    [method: string]: {
        route?: string,
        event?: string,
        upload?: string[],
        requireAuth?: boolean
    }
}

export function getDocMeta(Class: Function): MethodDocMeta {
    var str = Class.toString(),
        left = str,
        docs = str.match(docre),
        meta: MethodDocMeta = {};

    if (docs) {
        for (let doc of docs) {
            let i = left.indexOf(doc);
            left = left.substring(i + doc.length).trimLeft();

            let getMethod = () => {
                let j = left.indexOf("\n"),
                    line = left.substring(0, j).trim();

                let match = line.match(methodre);
                if (match) {
                    return match[3] || match[1];
                } else if (left.length) {
                    left = left.substring(j).trimLeft();
                    return getMethod();
                } else {
                    return void 0;
                }
            }

            let method: string = getMethod();
            if (method && Class.prototype[method] instanceof Function) {
                let match1 = doc.match(routere);
                let match2 = doc.match(eventre);
                let match3 = doc.match(uploadre);
                let match4 = doc.match(requireAuthRe);
                let route: string;
                let event: string;
                let upload: string[];
                let requireAuth: boolean = false;

                if (match1)
                    route = match1[1].trim();
                if (match2)
                    event = match2[1].trim();
                if (match3)
                    upload = match3[1].trim().split(/\s*,\s*/);
                if (match4)
                    requireAuth = true;

                if (route || event)
                    meta[method] = { route, event, upload, requireAuth };
            }
        }
    }
    return meta;
}

export function applyHttpControllerDoc(Class: typeof HttpController) {
    if (Class.hasOwnProperty("UploadFields") === false)
        Class.UploadFields = {};
    if (!Class.hasOwnProperty("UploadFields"))
        Class.RequireAuth = [];

    let meta = getDocMeta(Class);
    for (let method in meta) {
        if (meta[method].route)
            RouteMap[meta[method].route] = { Class, method };
        if (meta[method].upload)
            Class.UploadFields[method] = meta[method].upload;
        if (meta[method].requireAuth && !Class.RequireAuth.includes(method))
            Class.RequireAuth.push(method);
    }
}

export function applyWebSocketControllerDoc(Class: typeof WebSocketController) {
    let meta = getDocMeta(Class);
    for (let method in meta) {
        if (meta[method].event)
            EventMap[meta[method].event] = { Class, method };
    }
}

export function callsiteLog(err: Error) {
    var csr = CallSiteRecord({
        forError: err,
    });
    if (csr) {
        csr.render({}).then(str => {
            str = str.replace(/default_\d\./g, "default.");

            console.log();
            console.log(err.toString());
            console.log();
            console.log(str);
            console.log();
        }).catch(() => {
            console.log();
            console.log(err);
            console.log();
        });
    }
}

export function callMethod(ctrl: Controller, fn: Function, ...args: any[]): any {
    let res: any;

    if (fn.constructor.name == "GeneratorFunction" && config.awaitGenerator) {
        res = __awaiter(ctrl, args, null, fn);
    } else {
        res = fn.apply(ctrl, args);
    }

    return res;
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

export async function callFilterChain(
    filters: Array<ControllerFilter>,
    ctrl: Controller,
    skipFinish: boolean = false
): Promise<boolean | void> {
    if (!filters) return;

    let result: boolean | void;
    for (let filter of filters) {
        result = await filter.call(ctrl, ctrl);

        if (result === false
            || (ctrl["res"] && ctrl["res"].finished && skipFinish)
            || (ctrl["socket"] && ctrl["socket"].disconnected && skipFinish)) {
            break;
        }
    }
    return result;
}