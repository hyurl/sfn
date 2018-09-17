import * as path from "path";
import * as fs from "fs";
import { config as configEnv } from "dotenv";
// import lowerFirst = require("lodash/lowerFirst");

/** The version of framework. */
export const version: string = require("../package.json").version;

var appPath = path.dirname(process.mainModule.filename);
var argv = process.execArgv.join(" ");

/** Whether the current process is running in debug/inspect mode. */
export const isDebugMode = argv.includes("inspect") || argv.includes("debug");

/** Whether the current process is running in command line. */
export const isCli = appPath == __dirname + path.sep + "cli";

if (isCli) {
    appPath = process.cwd() + path.sep + "dist";
}

/** The root path of the project. */
export const ROOT_PATH = global["ROOT_PATH"] || path.normalize(appPath + "/..");

var tsCfgFile = ROOT_PATH + "/tsconfig.json";
var tsCfg: { [x: string]: any; };
var srcPath: string = appPath;

if (!global["SRC_PATH"] && fs.existsSync(tsCfgFile)) {
    // TypeScript
    try {
        tsCfg = require(tsCfgFile);
        if (tsCfg.compilerOptions && tsCfg.compilerOptions.rootDir) {
            srcPath = path.normalize(ROOT_PATH + "/" + tsCfg.compilerOptions.rootDir);
            appPath = path.normalize(ROOT_PATH + "/" + tsCfg.compilerOptions.outDir);
        }
    } catch (e) {
        srcPath = path.normalize(ROOT_PATH + "/src");
        appPath = path.normalize(ROOT_PATH + "/dist");
    }
} else if (!global["APP_PATH"]) {
    // JavaScript
    srcPath = appPath = ROOT_PATH + path.sep + "src";
}

/**
 * The application path, usually it's the distribution path. If your project 
 * isn't written in TypeScript, then `APP_PATH` equals `SRC_PATH`.
 */
export const APP_PATH: string = global["APP_PATH"] || appPath;

/** The source code path. */
export const SRC_PATH: string = global["SRC_PATH"] || srcPath;

/** Whether the project is written in TypeScript. */
export const isTypeScript = SRC_PATH != APP_PATH;

// support .env configuration file
configEnv({
    path: ROOT_PATH + "/.env"
});