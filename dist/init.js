"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv_1 = require("dotenv");
const chalk_1 = require("chalk");
const fs = require("fs");
const FRON = require("fron");
const alar_1 = require("alar");
var appPath = path.dirname(process.mainModule.filename);
var argv = process.execArgv.join(" ");
exports.version = require("../package.json").version;
exports.isDebugMode = argv.includes("inspect") || argv.includes("debug");
exports.isTsNode = argv.includes("ts-node");
exports.isCli = appPath == path.resolve(__dirname, "cli");
exports.isCli && (appPath = path.resolve(process.cwd(), "dist"));
exports.ROOT_PATH = path.normalize(appPath + "/..");
var srcPath = appPath;
try {
    let filename = exports.ROOT_PATH + "/tsconfig.json", jsonc = fs.readFileSync(filename, "utf8"), { compilerOptions } = FRON.parse(jsonc, filename), { rootDir, outDir } = compilerOptions || {};
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
        + chalk_1.default.yellow("https://sfnjs.com/docs/v0.5.x/debug"));
}
global["app"] = {
    ROOT_PATH: exports.ROOT_PATH,
    SRC_PATH: exports.SRC_PATH,
    APP_PATH: exports.APP_PATH,
    isDebugMode: exports.isDebugMode,
    isDevMode: exports.isDevMode,
    isTsNode: exports.isTsNode,
    isCli: exports.isCli,
    controllers: new alar_1.ModuleProxy("controllers", exports.APP_PATH + "/controllers"),
    models: new alar_1.ModuleProxy("models", exports.APP_PATH + "/models"),
    services: new alar_1.ModuleProxy("services", exports.APP_PATH + "/services"),
    locales: new alar_1.ModuleProxy("locales", exports.APP_PATH + "/locales")
};
//# sourceMappingURL=init.js.map