"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serveStatic = require("serve-static");
const load_config_1 = require("../bootstrap/load-config");
const index_1 = require("../bootstrap/index");
if (Array.isArray(load_config_1.config.statics)) {
    load_config_1.config.statics.forEach(path => index_1.app.use(serveStatic(path)));
}
else {
    for (let path in load_config_1.config.statics) {
        index_1.app.use(serveStatic(path, load_config_1.config.statics[path]));
    }
}
//# sourceMappingURL=http-static.js.map