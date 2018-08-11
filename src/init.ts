import * as path from "path";
import * as fs from "fs";
import "source-map-support/register";
import { config as configEnv } from "dotenv";

/** The version of framework. */
export var version: string = require("../package.json").version;

var appPath = path.dirname(process.mainModule.filename);

/** The root path of the project. */
export const ROOT_PATH = path.normalize(appPath + "/..");

/**
 * The application path, usually it's the distribution path. If your project 
 * isn't written in TypeScript, then `APP_PATH` equals `SRC_PATH`.
 */
export const APP_PATH: string = appPath;

var tsCfgFile = APP_PATH + "/../tsconfig.json";
var tsCfg: { [x: string]: any; };
var srcRoot: string = APP_PATH;

if (fs.existsSync(tsCfgFile)) {
    try {
        tsCfg = require(tsCfgFile);
        if (tsCfg.compilerOptions && tsCfg.compilerOptions.rootDir) {
            srcRoot = path.normalize(APP_PATH + "/../" + tsCfg.compilerOptions.rootDir);
        }
    } catch (e) { }
}

/** The source code path. */
export const SRC_PATH: string = srcRoot;

// support .env configuration file
configEnv({
    path: ROOT_PATH + "/.env"
});