import * as path from "path";
import { config as configEnv } from "dotenv";
import chalk from "chalk";
import * as fs from "fs";
import * as FRON from "fron";

declare global {
    namespace app {
        const ROOT_PATH: string;
        const SRC_PATH: string;
        const APP_PATH: string;
        const isDebugMode: boolean;
        const isDevMode: boolean;
        const isTsNode: boolean;
        const isCli: boolean;
    }
}

var appPath = path.dirname(process.mainModule.filename);
var argv = process.execArgv.join(" ");

/** The version of framework. */
export const version: string = require("../package.json").version;

/** Whether the current process is running in debug/inspect mode. */
export const isDebugMode = argv.includes("inspect") || argv.includes("debug");

/** Whether the current process is running in ts-node. */
export const isTsNode = argv.includes("ts-node");

/** Whether the current process is running in command line. */
export const isCli = appPath == path.resolve(__dirname, "cli");

isCli && (appPath = path.resolve(process.cwd(), "dist"));

/** The root path of the project. */
export const ROOT_PATH = path.normalize(appPath + "/..");

var srcPath: string = appPath;

try {
    let filename = ROOT_PATH + "/tsconfig.json",
        jsonc = fs.readFileSync(filename, "utf8"),
        { compilerOptions } = FRON.parse(jsonc, filename),
        { rootDir, outDir } = compilerOptions || <any>{};

    if (rootDir)
        srcPath = path.normalize(ROOT_PATH + "/" + rootDir);
    if (outDir)
        appPath = path.normalize(ROOT_PATH + "/" + outDir);
} catch (e) {
    srcPath = path.normalize(ROOT_PATH + "/src");
    appPath = path.normalize(ROOT_PATH + "/dist");
}

/** The source code path. */
export const SRC_PATH: string = srcPath;

/** The application path, usually it's the distribution path. */
export const APP_PATH: string = isTsNode ? SRC_PATH : appPath;

/** Whether the program is running in development mode. */
export const isDevMode = isDebugMode || !process.send;

// support .env configuration file
configEnv({ path: ROOT_PATH + "/.env" });

if (isDevMode && !isDebugMode && !isCli) {
    console.log("You program is running in development mode without "
        + "'--inspect' flag, please consider changing to debug environment.");
    console.log("For help, see "
        + chalk.yellow("https://sfnjs.com/docs/v0.5.x/debug"));
}

global["app"] = {
    ROOT_PATH,
    SRC_PATH,
    APP_PATH,
    isDebugMode,
    isDevMode,
    isTsNode,
    isCli
};