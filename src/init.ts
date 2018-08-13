import * as path from "path";
import * as fs from "fs";
import { config as configEnv } from "dotenv";

/** The version of framework. */
export var version: string = require("../package.json").version;

var appPath = path.dirname(process.mainModule.filename);

if (appPath == __dirname + path.sep + "cli") {
    appPath = process.cwd() + path.sep + "dist";
}

/** The root path of the project. */
export const ROOT_PATH = path.normalize(appPath + "/..");

var tsCfgFile = ROOT_PATH + "/tsconfig.json";
var tsCfg: { [x: string]: any; };
var srcRoot: string = appPath;

if (fs.existsSync(tsCfgFile)) {
    try {
        tsCfg = require(tsCfgFile);
        if (tsCfg.compilerOptions && tsCfg.compilerOptions.rootDir) {
            srcRoot = path.normalize(ROOT_PATH + "/" + tsCfg.compilerOptions.rootDir);
        }
    } catch (e) { }
} else {
    appPath = ROOT_PATH + path.sep + "src";
}

/**
 * The application path, usually it's the distribution path. If your project 
 * isn't written in TypeScript, then `APP_PATH` equals `SRC_PATH`.
 */
export const APP_PATH: string = appPath;

/** The source code path. */
export const SRC_PATH: string = srcRoot;

/** Whether the project is written in TypeScript. */
export const isTypeScript = SRC_PATH != APP_PATH;

// support .env configuration file
configEnv({
    path: ROOT_PATH + "/.env"
});