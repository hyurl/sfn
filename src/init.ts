import "source-map-support/register";
import * as path from "path";
import * as fs from "fs";
import { SFNConfig } from "./config";
import { dirname } from 'path';
export * from "./config";

/** The version of framework. */
export var version: string = require("../package.json").version;

var _root = dirname(process.mainModule.filename);

/** The application path, usually it's the distribution path. */
export const APP_PATH: string = (global["APP_PATH"] || _root).replace(/\\/g, "/");

/** The configuration of the program. */
export var config: SFNConfig = Object.assign({}, SFNConfig);

if (fs.existsSync(APP_PATH + "/config.js")) {
    // Load user-defined configurations.
    let m = require(APP_PATH + "/config.js");
    
    if (typeof m.config === "object") {
        config = Object.assign(config, m.config);
    } else if (typeof m.env === "string") {
        config = Object.assign(config, m);
    }
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

/** The source path. */
export const SRC_PATH: string = src_root;

/** Whether the program is running in development mode. */
export var isDevMode = config.env == "dev" || config.env == "development";