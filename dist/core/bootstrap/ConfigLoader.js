"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const init_1 = require("../../init");
const config_1 = require("../../config");
exports.config = config_1.config;
const sfn_worker_1 = require("sfn-worker");
const chalk_1 = require("chalk");
if (fs.existsSync(init_1.APP_PATH + "/config.js")) {
    let m = require(init_1.APP_PATH + "/config.js");
    if (typeof m.config == "object") {
        Object.assign(config_1.config, m.config);
    }
    else if (typeof m.default == "object") {
        Object.assign(config_1.config, m.default);
    }
    else if (typeof m.env == "string") {
        Object.assign(config_1.config, m);
    }
}
exports.isDevMode = config_1.config.env == "dev" || config_1.config.env == "development"
    || init_1.isDebugMode;
if (config_1.config.bluebird) {
    global.Promise = require("bluebird");
}
if (sfn_worker_1.isMaster && exports.isDevMode && !init_1.isDebugMode) {
    console.log("You program is running in development mode without "
        + "inspect flag, please consider changing to debug environment.");
    console.log("For help, see " + chalk_1.default.yellow("https://sfnjs.com/docs/debug"));
}
//# sourceMappingURL=ConfigLoader.js.map