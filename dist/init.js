"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("colors");
require("source-map-support/register");
const path = require("path");
const fs = require("fs");
const config_1 = require("./config");
const path_1 = require("path");
tslib_1.__exportStar(require("./config"), exports);
exports.version = require("../package.json").version;
var _root = path_1.dirname(process.mainModule.filename);
exports.APP_PATH = (global["APP_PATH"] || _root).replace(/\\/g, "/");
exports.config = null;
if (fs.existsSync(exports.APP_PATH + "/config.js")) {
    let m = require(exports.APP_PATH + "/config.js");
    if (typeof m.config === "object") {
        exports.config = m.config;
    }
    else if (typeof m.dev === "string") {
        exports.config = m;
    }
    exports.config = Object.assign(config_1.SFNConfig, exports.config);
}
var tscfgfile = exports.APP_PATH + "/../tsconfig.json";
var tscfg;
var src_root = exports.APP_PATH;
if (fs.existsSync(tscfgfile)) {
    try {
        tscfg = require(tscfgfile);
        if (tscfg.compilerOptions && tscfg.compilerOptions.rootDir) {
            src_root = path.normalize(exports.APP_PATH + "/../" + tscfg.compilerOptions.rootDir);
            src_root = src_root.replace(/\\/g, "/");
        }
    }
    catch (e) { }
}
exports.SRC_PATH = src_root;
//# sourceMappingURL=init.js.map