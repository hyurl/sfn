import * as fs from "fs";
import merge = require("lodash/merge");
import { APP_PATH, isDebugMode, isCli } from "../../init";
import { config } from "../../config";
import chalk from "chalk";
import * as Mail from "sfn-mail";

export { config };

if (fs.existsSync(APP_PATH + "/config.js")) {
    // Load user-defined configurations.
    let m = require(APP_PATH + "/config.js");

    if (typeof m.config == "object") {
        merge(config, m.config);
    } else if (typeof m.default == "object") {
        merge(config, m.default);
    } else if (typeof m.env == "string") {
        merge(config, m);
    }
}

/** Whether the program is running in development mode. */
export const isDevMode = isDebugMode || !process.send;

if (isDevMode && !isDebugMode && !isCli) {
    console.log("You program is running in development mode without "
        + "'--inspect' flag, please consider changing to debug environment.");
    console.log("For help, see "
        + chalk.yellow("https://sfnjs.com/docs/v0.3.x/debug"));
}

Mail.init(config.mail); // initiate mail configurations