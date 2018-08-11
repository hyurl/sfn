"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const init_1 = require("../../init");
const config_1 = require("../../config");
exports.SFNConfig = config_1.SFNConfig;
exports.config = Object.assign({}, config_1.SFNConfig);
exports.isDevMode = true;
if (fs.existsSync(init_1.APP_PATH + "/config.js")) {
    let m = require(init_1.APP_PATH + "/config.js");
    if (typeof m.config === "object") {
        exports.config = Object.assign(exports.config, m.config);
    }
    else if (typeof m.env === "string") {
        exports.config = Object.assign(exports.config, m);
    }
}
exports.isDevMode = exports.config.env == "dev" || exports.config.env == "development";
if (exports.config.bluebird) {
    global.Promise = require("bluebird");
}
//# sourceMappingURL=ConfigLoader.js.map