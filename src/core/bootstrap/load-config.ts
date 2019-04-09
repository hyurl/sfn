import merge = require("lodash/merge");
import startsWith = require("lodash/startsWith");
import { APP_PATH } from "../../init";
import config from "../../config";
import { moduleExists, createImport } from '../tools/internal/module';

export { config };

declare global {
    namespace app {
        const config: Config;
    }
}

global["app"].config = config;

let moduleName = APP_PATH + "/config";
let tryImport = createImport(require);

if (!startsWith(__filename, APP_PATH) && moduleExists(moduleName)) {
    // Load user-defined configurations.
    let mod = tryImport(moduleName);

    if (typeof mod.default == "object") {
        merge(config, mod.default);
    }
}

let { server: { hostname, http: { port, type } } } = config,
    host = hostname + (port == 80 || port == 443 ? "" : ":" + port);

/** The base URL of the server (calculated according to the config). */
export const baseUrl = (type == "http2" ? "https" : type) + "://" + host;