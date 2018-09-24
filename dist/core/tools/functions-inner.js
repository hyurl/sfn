"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = require("path");
const tslib_2 = require("tslib");
const CallSiteRecord = require("callsite-record");
const chalk_1 = require("chalk");
const date = require("sfn-date");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
const functions_1 = require("./functions");
function loadLanguagePack(filename) {
    let ext = path_1.extname(filename), name = path_1.basename(filename, ext).replace(/\-/g, ""), _module = require(filename), lang;
    if (typeof _module[name] === "object") {
        lang = _module[name];
    }
    else if (typeof _module.default === "object") {
        lang = _module.default;
    }
    else {
        lang = _module;
    }
    if (lang instanceof Array) {
        let _lang = {};
        for (let v of lang) {
            _lang[v] = v;
        }
        lang = _lang;
    }
    return lang;
}
exports.loadLanguagePack = loadLanguagePack;
const docre = /\/\*\*[\s\S]*?\*\/$/mg;
const methodre = /^([a-zA-Z0-9_]+)\s*\(|^(async|\*)\s+([a-zA-Z0-9_]+)\s*\(/;
const routere = /@route\s+([A-Z]+\s+\S+)\s*([\r\n]|\*\/)/;
const eventre = /@event\s+(.*)([\r\n]|\*\/)/;
const uploadre = /@upload\s+(.*)([\r\n]|\*\/)/;
const requireAuthRe = /@requireAuth\s*([\r\n]|\*\/)/;
function getDocMeta(Class) {
    var str = Class.toString(), left = str, docs = str.match(docre), meta = {};
    if (docs) {
        for (let doc of docs) {
            let i = left.indexOf(doc);
            left = left.substring(i + doc.length).trimLeft();
            let getMethod = () => {
                let j = left.indexOf("\n"), line = left.substring(0, j).trim();
                let match = line.match(methodre);
                if (match) {
                    return match[3] || match[1];
                }
                else if (left.length) {
                    left = left.substring(j).trimLeft();
                    return getMethod();
                }
                else {
                    return void 0;
                }
            };
            let method = getMethod();
            if (method && Class.prototype[method] instanceof Function) {
                let match1 = doc.match(routere);
                let match2 = doc.match(eventre);
                let match3 = doc.match(uploadre);
                let match4 = doc.match(requireAuthRe);
                let route;
                let event;
                let upload;
                let requireAuth = false;
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
exports.getDocMeta = getDocMeta;
function applyHttpControllerDoc(Class) {
    if (Class.hasOwnProperty("UploadFields") === false)
        Class.UploadFields = {};
    if (!Class.hasOwnProperty("RequireAuth"))
        Class.RequireAuth = [];
    let meta = getDocMeta(Class);
    for (let method in meta) {
        if (meta[method].route)
            functions_1.route(meta[method].route, Class, method);
        if (meta[method].upload)
            functions_1.upload(...meta[method].upload)(Class.prototype, method);
        if (meta[method].requireAuth)
            functions_1.requireAuth(Class.prototype, method);
    }
}
exports.applyHttpControllerDoc = applyHttpControllerDoc;
function applyWebSocketControllerDoc(Class) {
    let meta = getDocMeta(Class);
    for (let method in meta) {
        if (meta[method].event)
            functions_1.event(meta[method].event, Class, method);
        if (meta[method].requireAuth)
            functions_1.requireAuth(Class.prototype, method);
    }
}
exports.applyWebSocketControllerDoc = applyWebSocketControllerDoc;
function callsiteLog(err) {
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
exports.callsiteLog = callsiteLog;
function callMethod(ctrl, fn, ...args) {
    let res;
    if (fn.constructor.name == "GeneratorFunction" && ConfigLoader_1.config.awaitGenerator) {
        res = tslib_2.__awaiter(ctrl, args, null, fn);
    }
    else {
        res = fn.apply(ctrl, args);
    }
    return res;
}
exports.callMethod = callMethod;
function getFuncParams(fn) {
    let fnStr = fn.toString(), start = fnStr.indexOf("("), end = fnStr.indexOf(")"), paramStr = fnStr.slice(start + 1, end).trim(), params = paramStr.split(",").map(param => {
        return param.replace(/\s/g, "").split("=")[0];
    });
    return params;
}
exports.getFuncParams = getFuncParams;
function callIntercepterChain(filters, ctrl, skipFinish = false) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!filters)
            return;
        let result;
        for (let filter of filters) {
            result = yield filter.call(ctrl, ctrl);
            if (result === false
                || (ctrl["res"] && ctrl["res"].sent && skipFinish)
                || (ctrl["socket"] && ctrl["socket"].disconnected && skipFinish)) {
                break;
            }
        }
        return result;
    });
}
exports.callIntercepterChain = callIntercepterChain;
function color(color, callSite, bindings) {
    let msg = callSite.map((str, i) => {
        return i > 0 ? bindings[i - 1] + str : str;
    }).join("");
    return chalk_1.default[color](`[${date("Y-m-d H:i:s.ms")}]`) + " " + msg;
}
function grey(callSite, ...bindings) {
    return color("grey", callSite, bindings);
}
exports.grey = grey;
function green(callSite, ...bindings) {
    return color("green", callSite, bindings);
}
exports.green = green;
function yellow(callSite, ...bindings) {
    return color("yellow", callSite, bindings);
}
exports.yellow = yellow;
function red(callSite, ...bindings) {
    return color("red", callSite, bindings);
}
exports.red = red;
//# sourceMappingURL=functions-inner.js.map