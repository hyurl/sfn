"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const dotenv_1 = require("dotenv");
exports.version = require("../package.json").version;
var appPath = path.dirname(process.mainModule.filename);
if (appPath == __dirname + path.sep + "cli") {
    appPath = process.cwd() + path.sep + "dist";
}
exports.ROOT_PATH = path.normalize(appPath + "/..");
var tsCfgFile = exports.ROOT_PATH + "/tsconfig.json";
var tsCfg;
var srcRoot = appPath;
if (fs.existsSync(tsCfgFile)) {
    try {
        tsCfg = require(tsCfgFile);
        if (tsCfg.compilerOptions && tsCfg.compilerOptions.rootDir) {
            srcRoot = path.normalize(exports.ROOT_PATH + "/" + tsCfg.compilerOptions.rootDir);
        }
    }
    catch (e) { }
}
else {
    appPath = exports.ROOT_PATH + path.sep + "src";
}
exports.APP_PATH = appPath;
exports.SRC_PATH = srcRoot;
exports.isTypeScript = exports.SRC_PATH != exports.APP_PATH;
dotenv_1.config({
    path: exports.ROOT_PATH + "/.env"
});
//# sourceMappingURL=init.js.map