"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serveStatic = require("serve-static");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
const index_1 = require("../bootstrap/index");
if (Array.isArray(ConfigLoader_1.config.statics)) {
    ConfigLoader_1.config.statics.forEach(path => index_1.app.use(serveStatic(path)));
}
else {
    for (let path in ConfigLoader_1.config.statics) {
        index_1.app.use(serveStatic(path, ConfigLoader_1.config.statics[path]));
    }
}
//# sourceMappingURL=http-static.js.map