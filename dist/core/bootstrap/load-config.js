"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const merge = require("lodash/merge");
const startsWith = require("lodash/startsWith");
const init_1 = require("../../init");
const config_1 = require("../../config");
exports.config = config_1.config;
const Mail = require("sfn-mail");
const functions_inner_1 = require("../tools/functions-inner");
app.config = config_1.config;
let moduleName = init_1.APP_PATH + "/config";
let tryImport = functions_inner_1.createImport(require);
if (!startsWith(__filename, init_1.APP_PATH) && functions_inner_1.moduleExists(moduleName)) {
    let mod = tryImport(moduleName);
    if (typeof mod.default == "object") {
        merge(config_1.config, mod.default);
    }
    else if (typeof mod.config == "object") {
        merge(config_1.config, mod.config);
    }
}
let { server: { hostname, http: { port, type } } } = config_1.config, host = hostname + (port == 80 || port == 443 ? "" : ":" + port);
exports.baseUrl = (type == "http2" ? "https" : type) + "://" + host;
Mail.init(config_1.config.mail);
//# sourceMappingURL=load-config.js.map