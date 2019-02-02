"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const merge = require("lodash/merge");
const startsWith = require("lodash/startsWith");
const init_1 = require("../../init");
const config_1 = require("../../config");
exports.config = config_1.config;
const Mail = require("sfn-mail");
const functions_inner_1 = require("../tools/functions-inner");
let moduleName = init_1.APP_PATH + "/config";
let tryImport = functions_inner_1.createImport(require);
if (!startsWith(__filename, init_1.APP_PATH) && functions_inner_1.moduleExists(moduleName)) {
    let m = tryImport(moduleName);
    if (typeof m.config == "object") {
        merge(config_1.config, m.config);
    }
    else if (typeof m.default == "object") {
        merge(config_1.config, m.default);
    }
    else if (typeof m.server == "object") {
        merge(config_1.config, m);
    }
}
let { server: { hostname, http: { port, type } } } = config_1.config, host = hostname + (port == 80 || port == 443 ? "" : ":" + port);
exports.baseUrl = (type == "http2" ? "https" : type) + "://" + host;
Mail.init(config_1.config.mail);
//# sourceMappingURL=load-config.js.map