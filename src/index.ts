import { config } from "./init";

if (config.bluebird) {
    global.Promise = require("bluebird");
}

export * from "./core/bootstrap/index";