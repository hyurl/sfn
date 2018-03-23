import "colors";
import "source-map-support/register";
import * as path from "path";
import * as fs from "fs";
import { SFNConfig } from "./config";
import { dirname } from 'path';
export * from "./config";

export var version: string = require("../package.json").version;

var _root = dirname(process.mainModule.filename);

export const APP_PATH: string = (global["APP_PATH"] || _root).replace(/\\/g, "/");

export var config: SFNConfig = null;
if (fs.existsSync(APP_PATH + "/config.js")) {
    // Load user-defined configurations.
    let m = require(APP_PATH + "/config.js");
    if (typeof m.config === "object") {
        config = m.config;
    } else if (typeof m.dev === "string") {
        config = m;
    }
    config = Object.assign(SFNConfig, config);
}

var tscfgfile = APP_PATH + "/../tsconfig.json";
var tscfg: { [x: string]: any; };
var src_root: string = APP_PATH;

if (fs.existsSync(tscfgfile)) {
    try {
        tscfg = require(tscfgfile);
        if (tscfg.compilerOptions && tscfg.compilerOptions.rootDir) {
            src_root = path.normalize(APP_PATH + "/../" + tscfg.compilerOptions.rootDir);
            src_root = src_root.replace(/\\/g, "/");
        }
    } catch (e) { }
}

export const SRC_PATH: string = src_root;