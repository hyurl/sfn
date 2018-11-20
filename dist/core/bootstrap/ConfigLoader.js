"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const merge = require("lodash/merge");
const init_1 = require("../../init");
const config_1 = require("../../config");
exports.config = config_1.config;
const chalk_1 = require("chalk");
const Mail = require("sfn-mail");
if (fs.existsSync(init_1.APP_PATH + "/config.js")) {
    let m = require(init_1.APP_PATH + "/config.js");
    if (typeof m.config == "object") {
        merge(config_1.config, m.config);
    }
    else if (typeof m.default == "object") {
        merge(config_1.config, m.default);
    }
    else if (typeof m.env == "string") {
        merge(config_1.config, m);
    }
}
exports.isDevMode = init_1.isDebugMode || !process.send;
if (exports.isDevMode && !init_1.isDebugMode && !init_1.isCli) {
    console.log("You program is running in development mode without "
        + "'--inspect' flag, please consider changing to debug environment.");
    console.log("For help, see "
        + chalk_1.default.yellow("https://sfnjs.com/docs/v0.3.x/debug"));
}
Mail.init(config_1.config.mail);
//# sourceMappingURL=ConfigLoader.js.map