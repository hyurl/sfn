import * as fs from "fs";
import { APP_PATH } from "../../init";
import { SFNConfig, StaticOptions } from "../../config";

export { SFNConfig, StaticOptions };

/** The configuration of the program. */
export var config: SFNConfig = Object.assign({}, SFNConfig);
export var isDevMode = true;

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
isDevMode = config.env == "dev" || config.env == "development";

if (config.bluebird) {
    global.Promise = require("bluebird");
}