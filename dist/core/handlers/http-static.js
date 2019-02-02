"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serveStatic = require("serve-static");
const load_config_1 = require("../bootstrap/load-config");
const index_1 = require("../bootstrap/index");
const startsWith = require("lodash/startsWith");
const path_1 = require("path");
const init_1 = require("../../init");
if (Array.isArray(load_config_1.config.statics)) {
    load_config_1.config.statics.forEach(path => {
        index_1.app.use(serveStatic(path_1.resolve(init_1.SRC_PATH, path)));
    });
}
else {
    for (let path in load_config_1.config.statics) {
        let options = load_config_1.config.statics[path], _path = path_1.resolve(init_1.SRC_PATH, path), handle = serveStatic(_path, options);
        index_1.app.use(async (req, res, next) => {
            if (options.prefix) {
                let prefix = typeof options.prefix == "string"
                    ? options.prefix
                    : _path.slice(init_1.SRC_PATH.length);
                if (startsWith(req.url, prefix + "/")) {
                    req.url = req.url.slice(prefix.length);
                    return handle(req, res, () => {
                        req.url = req["originalUrl"];
                        next();
                    });
                }
                else {
                    next();
                }
            }
            else {
                handle(req, res, next);
            }
        });
    }
}
//# sourceMappingURL=http-static.js.map