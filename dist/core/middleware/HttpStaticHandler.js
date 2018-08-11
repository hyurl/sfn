"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serveStatic = require("serve-static");
const fs = require("fs");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
function handleStatic(app) {
    if (ConfigLoader_1.config.statics) {
        if (Array.isArray(ConfigLoader_1.config.statics)) {
            ConfigLoader_1.config.statics.forEach(path => app.use(serveStatic(path)));
        }
        else {
            for (let path in ConfigLoader_1.config.statics) {
                app.use(serveStatic(path, ConfigLoader_1.config.statics[path]));
            }
        }
    }
    else if (ConfigLoader_1.config.staticPath && fs.existsSync(ConfigLoader_1.config.staticPath)) {
        app.use(serveStatic(ConfigLoader_1.config.staticPath));
    }
}
exports.handleStatic = handleStatic;
//# sourceMappingURL=HttpStaticHandler.js.map