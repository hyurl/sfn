import merge = require("lodash/merge");
import startsWith = require("lodash/startsWith");
import { APP_PATH } from "../../init";
import config from "../../config";
import { moduleExists, createImport } from '../tools/internal/module';

global.app.config = config;

let moduleName = APP_PATH + "/config";
let tryImport = createImport(require);

if (!startsWith(__filename, APP_PATH) && moduleExists(moduleName)) {
    // Load user-defined configurations.
    let mod = tryImport(moduleName);

    if (typeof mod.default == "object") {
        merge(config, mod.default);
    }
}