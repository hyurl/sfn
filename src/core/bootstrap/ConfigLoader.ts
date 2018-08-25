import * as fs from "fs";
import { APP_PATH, isDebugMode } from "../../init";
import { SFNConfig, StaticOptions } from "../../config";
import { isMaster } from 'sfn-worker';
import chalk from "chalk";

export { SFNConfig, StaticOptions };

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

/** Whether the program is running in development mode. */
export const isDevMode = config.env == "dev" || config.env == "development"
    || isDebugMode;

if (config.bluebird) {
    global.Promise = require("bluebird");
}

if (isMaster && isDevMode && !isDebugMode) {
    console.log("You program is running in development mode without "
        + "inspect flag, please consider changing to debug environment.");
    console.log("For help, see " + chalk.yellow("https://sfnjs.com/docs/debug"));
}