"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
require("source-map-support/register");
const dotenv_1 = require("dotenv");
exports.version = require("../package.json").version;
var appPath = path.dirname(process.mainModule.filename);
exports.ROOT_PATH = path.normalize(appPath + "/..");
exports.APP_PATH = appPath;
var tsCfgFile = exports.APP_PATH + "/../tsconfig.json";
var tsCfg;
var srcRoot = exports.APP_PATH;
if (fs.existsSync(tsCfgFile)) {
    try {
        tsCfg = require(tsCfgFile);
        if (tsCfg.compilerOptions && tsCfg.compilerOptions.rootDir) {
            srcRoot = path.normalize(exports.APP_PATH + "/../" + tsCfg.compilerOptions.rootDir);
        }
    }
    catch (e) { }
}
exports.SRC_PATH = srcRoot;
dotenv_1.config({
    path: exports.ROOT_PATH + "/.env"
});
//# sourceMappingURL=init.js.map