import * as path from "path";
import { config as configEnv } from "dotenv";

/** The version of framework. */
export const version: string = require("../package.json").version;

var appPath = path.dirname(process.mainModule.filename);
var argv = process.execArgv.join(" ");

/** Whether the current process is running in debug/inspect mode. */
export const isDebugMode = argv.includes("inspect") || argv.includes("debug");

/** Whether the current process is running in command line. */
export const isCli = appPath == __dirname + path.sep + "cli";

/** Whether the current process is running in ts-node. */
export const isTsNode = argv.includes("ts-node");

if (isCli) {
    appPath = process.cwd() + path.sep + "dist";
}

/** The root path of the project. */
export const ROOT_PATH = global["ROOT_PATH"] || path.normalize(appPath + "/..");

var tsCfg: { [x: string]: any; };
var srcPath: string = appPath;

try {
    tsCfg = require(ROOT_PATH + "/tsconfig.json");

    if (tsCfg.compilerOptions && tsCfg.compilerOptions.rootDir) {
        srcPath = path.normalize(ROOT_PATH + "/" + tsCfg.compilerOptions.rootDir);
        appPath = path.normalize(ROOT_PATH + "/" + tsCfg.compilerOptions.outDir);
    }
} catch (e) {
    srcPath = path.normalize(ROOT_PATH + "/src");
    appPath = path.normalize(ROOT_PATH + "/dist");
}

/** The source code path. */
export const SRC_PATH: string = global["SRC_PATH"] || srcPath;

/** The application path, usually it's the distribution path. */
export const APP_PATH: string = isTsNode ? SRC_PATH : global["APP_PATH"] || appPath;

// support .env configuration file
configEnv({
    path: ROOT_PATH + "/.env"
});