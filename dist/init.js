"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
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
var tsCfg;
var srcPath = appPath;
try {
    tsCfg = require(exports.ROOT_PATH + "/tsconfig.json");
    if (tsCfg.compilerOptions && tsCfg.compilerOptions.rootDir) {
        srcPath = path.normalize(exports.ROOT_PATH + "/" + tsCfg.compilerOptions.rootDir);
        appPath = path.normalize(exports.ROOT_PATH + "/" + tsCfg.compilerOptions.outDir);
    }
}
catch (e) {
    srcPath = path.normalize(exports.ROOT_PATH + "/src");
    appPath = path.normalize(exports.ROOT_PATH + "/dist");
}
exports.APP_PATH = global["APP_PATH"] || appPath;
exports.SRC_PATH = global["SRC_PATH"] || srcPath;
dotenv_1.config({
    path: exports.ROOT_PATH + "/.env"
});
//# sourceMappingURL=init.js.map