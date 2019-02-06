import * as path from "path";
import { config as configEnv } from "dotenv";
import chalk from "chalk";
import * as fs from "fs";
import * as FRON from "fron";
import { ModuleProxy, RpcOptions, RpcChannel, FSWatcher } from "alar";

/** The version of framework. */
export const version: string = require("../package.json").version;

var appPath = path.dirname(process.mainModule.filename);
var argv = process.execArgv.join(" ");

/** Whether the current process is running in debug/inspect mode. */
export const isDebugMode = argv.includes("inspect") || argv.includes("debug");

/** Whether the current process is running in ts-node. */
export const isTsNode = argv.includes("ts-node");

/** Whether the current process is running in command line. */
export const isCli = appPath == __dirname + path.sep + "cli";

if (isCli)
    appPath = process.cwd() + path.sep + "dist";

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
        + chalk.yellow("https://sfnjs.com/docs/v0.3.x/debug"));
}

declare global {
    namespace app {
        namespace controllers {
            function resolve(path: string): string;
            function serve(config: string | RpcOptions): RpcChannel;
            function connect(config: string | RpcOptions): RpcChannel;
            function watch(listener?: (event: "change" | "unlink", filename: string) => void): FSWatcher;
        }
        namespace models {
            function resolve(path: string): string;
            function serve(config: string | RpcOptions): RpcChannel;
            function connect(config: string | RpcOptions): RpcChannel;
            function watch(listener?: (event: "change" | "unlink", filename: string) => void): FSWatcher;
        }
        namespace services {
            function resolve(path: string): string;
            function serve(config: string | RpcOptions): RpcChannel;
            function connect(config: string | RpcOptions): RpcChannel;
            function watch(listener?: (event: "change" | "unlink", filename: string) => void): FSWatcher;
        }
    }
}

global["app"] = {
    controllers: new ModuleProxy("controllers", APP_PATH + "/controllers"),
    models: new ModuleProxy("models", APP_PATH + "/models"),
    services: new ModuleProxy("services", APP_PATH + "/services")
};