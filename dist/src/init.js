"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const dotenv_1 = require("dotenv");
exports.version = require("../package.json").version;
var appPath = path.dirname(process.mainModule.filename);
var argv = process.execArgv.join(" ");
exports.isDebugMode = argv.includes("inspect") || argv.includes("debug");
exports.isCli = appPath == __dirname + path.sep + "cli";
if (exports.isCli) {
    appPath = process.cwd() + path.sep + "dist";
}
exports.ROOT_PATH = global["ROOT_PATH"] || path.normalize(appPath + "/..");
var tsCfgFile = exports.ROOT_PATH + "/tsconfig.json";
var tsCfg;
var srcRoot = appPath;
if (!global["SRC_PATH"] && fs.existsSync(tsCfgFile)) {
    try {
        tsCfg = require(tsCfgFile);
        if (tsCfg.compilerOptions && tsCfg.compilerOptions.rootDir) {
            srcRoot = path.normalize(exports.ROOT_PATH + "/" + tsCfg.compilerOptions.rootDir);
            appPath = path.normalize(exports.ROOT_PATH + "/" + tsCfg.compilerOptions.outDir);
        }
    }
    catch (e) { }
}
else if (!global["APP_PATH"]) {
    appPath = exports.ROOT_PATH + path.sep + "src";
}
exports.APP_PATH = global["APP_PATH"] || appPath;
exports.SRC_PATH = global["SRC_PATH"] || srcRoot;
exports.isTypeScript = exports.SRC_PATH != exports.APP_PATH;
dotenv_1.config({
    path: exports.ROOT_PATH + "/.env"
});
//# sourceMappingURL=init.js.map