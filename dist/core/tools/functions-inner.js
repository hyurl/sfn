"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = require("path");
const CallSiteRecord = require("callsite-record");
const moment = require("moment");
const fs = require("fs-extra");
const chalk_1 = require("chalk");
const init_1 = require("../../init");
let logService;
const FileCache = {};
function moduleExists(name) {
    return fs.existsSync(name + (init_1.isTsNode ? ".ts" : ".js"));
}
exports.moduleExists = moduleExists;
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
function loadFile(filename, fromCache = false) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (fromCache && FileCache[filename] !== undefined) {
            return FileCache[filename];
        }
        else {
            let content = yield fs.readFile(filename, "utf8");
            fromCache && (FileCache[filename] = content);
            return content;
        }
    });
}
exports.loadFile = loadFile;
function callsiteLog(err) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        var csr = CallSiteRecord({
            forError: err,
        });
        if (csr) {
            let str = yield csr.render({});
            str = str.replace(/default_\d\./g, "default.");
            console.log();
            console.log(err.toString());
            console.log();
            console.log(str);
            console.log();
        }
    });
}
exports.callsiteLog = callsiteLog;
function createImport(require) {
    return (id) => {
        try {
            return require(id);
        }
        catch (err) {
            if (init_1.isDevMode) {
                callsiteLog(err);
            }
            else {
                let msg = err.toString(), i = err.stack.indexOf("\n") + 1, stack;
                stack = (err.stack.slice(i, err.stack.indexOf("\n", i))).trim();
                stack = stack.replace("_1", "").slice(3);
                process.nextTick(() => {
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
exports.createImport = createImport;
function getFuncParams(fn) {
    let fnStr = fn.toString(), start = fnStr.indexOf("("), end = fnStr.indexOf(")"), paramStr = fnStr.slice(start + 1, end).trim(), params = paramStr.split(",").map(param => {
        return param.replace(/\s/g, "").split("=")[0];
    });
    return params;
}
exports.getFuncParams = getFuncParams;
function color(color, callSite, bindings) {
    let msg = callSite.map((str, i) => {
        return i > 0 ? bindings[i - 1] + str : str;
    }).join("");
    return chalk_1.default[color](`[${moment().format("YYYY-MM-DDTHH:mm:ss")}]`) + " " + msg;
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