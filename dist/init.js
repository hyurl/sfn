"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv_1 = require("dotenv");
const chalk_1 = require("chalk");
const fs = require("fs");
const jsonc = require("jsonc-parser");
exports.version = require("../package.json").version;
var appPath = path.dirname(process.mainModule.filename);
var argv = process.execArgv.join(" ");
exports.isDebugMode = argv.includes("inspect") || argv.includes("debug");
exports.isTsNode = argv.includes("ts-node");
exports.isCli = appPath == __dirname + path.sep + "cli";
if (exports.isCli)
    appPath = process.cwd() + path.sep + "dist";
exports.ROOT_PATH = path.normalize(appPath + "/..");
var srcPath = appPath;
try {
    let json = fs.readFileSync(exports.ROOT_PATH + "/tsconfig.json", "utf8"), { compilerOptions } = jsonc.parse(json), { rootDir, outDir } = compilerOptions || {};
    if (rootDir)
        srcPath = path.normalize(exports.ROOT_PATH + "/" + rootDir);
    if (outDir)
        appPath = path.normalize(exports.ROOT_PATH + "/" + outDir);
}
catch (e) {
    srcPath = path.normalize(exports.ROOT_PATH + "/src");
    appPath = path.normalize(exports.ROOT_PATH + "/dist");
}
exports.SRC_PATH = srcPath;
exports.APP_PATH = exports.isTsNode ? exports.SRC_PATH : appPath;
exports.isDevMode = exports.isDebugMode || !process.send;
dotenv_1.config({ path: exports.ROOT_PATH + "/.env" });
if (exports.isDevMode && !exports.isDebugMode && !exports.isCli) {
    console.log("You program is running in development mode without "
        + "'--inspect' flag, please consider changing to debug environment.");
    console.log("For help, see "
        + chalk_1.default.yellow("https://sfnjs.com/docs/v0.3.x/debug"));
}
//# sourceMappingURL=init.js.map