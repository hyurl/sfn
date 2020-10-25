import * as path from "path";
import * as fs from "fs";
import * as FRON from "fron";
import parseArgv = require("minimist");
import ensureType from "@hyurl/utils/ensureType";
import trimEnd = require("lodash/trimEnd");
import define from '@hyurl/utils/define';
import isVoid from "@hyurl/utils/isVoid";

declare global {
    namespace NodeJS {
        interface Global {
            app: { [name: string]: any; };
        }
    }

    namespace app {
        const ROOT_PATH: string;
        const SRC_PATH: string;
        const APP_PATH: string;
        const isDebugMode: boolean;
        const isDevMode: boolean;
        const isTsNode: boolean;
        const isCli: boolean;
        const argv: parseArgv.ParsedArgs;

        /** The version number set in the project's package.json. */
        const version: string;

        /** @alias `app.APP_PATH` */
        const path: string;

        /**
         * In the web server, the app ID would be either `web-server`, or 
         * `web-server-<n>` when started with PM2, where `<n>` is the 
         * `process.env.NODE_APP_INSTANCE`; in an RPC server, the app ID is the
         * ID passed to `app.serve()`.
         * 
         * NOTE: the ID will only be available until the server has started.
         * 
         * @see http://pm2.keymetrics.io/docs/usage/environment/#node-app-instance-pm2-25-minimum
         */
        const id: string;

        /**
         * @deprecated
         * 
         * Since v0.6, this variable is a getter/setter of `app.id`, should use
         * the later instead for more convenience.
         */
        const serverId: string;

        /**
         * Whether the current process runs as a web server, it's `false` by
         * default, and become `true` once `app.serve()` is called to ship the
         * web server.
         */
        const isWebServer: boolean;

        /**
         * Whether the current process runs as a script, scripts is run via the
         * command `npx sfn <filename>`.
         */
        const isScript: boolean;
    }
}

var appPath = path.dirname(require.main.filename);
var argv = process.execArgv.join(" ");

appPath === path.resolve(__dirname, "..") && (appPath = __dirname);

/** The version of framework. */
export const version: string = require("../package.json").version;

/** Whether the current process is running in debug/inspect mode. */
export const isDebugMode = argv.includes("inspect")
    || argv.includes("debug")
    || (() => {
        try {
            return !isVoid(require("inspector").url());
        } catch (e) {
            return false;
        }
    })();

/** Whether the current process is running in ts-node. */
export const isTsNode = argv.includes("ts-node");

/** Whether the current process is running in command line. */
export const isCli = appPath == path.resolve(__dirname, "cli");

isCli && (appPath = path.resolve(process.cwd(), "dist"));

/** The root path of the project. */
export const ROOT_PATH = global["ROOT_PATH"] || path.normalize(appPath + "/..");

var srcPath: string = appPath;

try {
    let filename = ROOT_PATH + "/tsconfig.json",
        jsonc = fs.readFileSync(filename, "utf8"),
        { compilerOptions } = FRON.parse(jsonc, filename),
        { rootDir, outDir } = compilerOptions || <any>{};

    if (rootDir)
        srcPath = path.normalize(ROOT_PATH + "/" + trimEnd(rootDir, "/"));
    if (outDir)
        appPath = path.normalize(ROOT_PATH + "/" + trimEnd(outDir, "/"));
} catch (e) {
    srcPath = path.normalize(ROOT_PATH + "/src");
    appPath = path.normalize(ROOT_PATH + "/dist");
}

/** The source code path. */
export const SRC_PATH: string = srcPath;

/** The application path, usually it's the distribution path. */
export const APP_PATH: string = isTsNode ? SRC_PATH : appPath;

/** Whether the program is running in development mode. */
export const isDevMode = isDebugMode ||
    !(process.send && process.env.NODE_APP_INSTANCE); // PM2 special

define(global, "app", {
    ROOT_PATH,
    SRC_PATH,
    APP_PATH,
    isDebugMode,
    isDevMode,
    isTsNode,
    isCli,
    argv: ensureType(parseArgv(process.argv)),
    isWebServer: false,
    isScript: false,
    version: require(ROOT_PATH + "/package.json").version,
    path: APP_PATH
});

define(app, "serverId", { get: () => app.id });
