"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CallSiteRecord = require("callsite-record");
const moment = require("moment");
const fs = require("fs-extra");
const chalk_1 = require("chalk");
const init_1 = require("../../init");
const Service_1 = require("./Service");
const FileCache = {};
function isOwnMethod(obj, method) {
    return typeof obj[method] === "function" &&
        obj.constructor.prototype.hasOwnProperty(method);
}
exports.isOwnMethod = isOwnMethod;
function moduleExists(name) {
    return fs.existsSync(name + (init_1.isTsNode ? ".ts" : ".js"));
}
exports.moduleExists = moduleExists;
async function loadFile(filename, fromCache = false) {
    if (fromCache && FileCache[filename] !== undefined) {
        return FileCache[filename];
    }
    else {
        let content = await fs.readFile(filename, "utf8");
        fromCache && (FileCache[filename] = content);
        return content;
    }
}
exports.loadFile = loadFile;
async function callsiteLog(err) {
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
                    Service_1.default.logger.hackTrace(stack);
                    Service_1.default.logger.error(msg);
                });
            }
            return {};
        }
    };
}
exports.createImport = createImport;
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