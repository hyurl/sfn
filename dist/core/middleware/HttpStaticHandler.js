"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serveStatic = require("serve-static");
const fs = require("fs");
const init_1 = require("../../init");
function handleStatic(app) {
    if (init_1.config.statics) {
        if (Array.isArray(init_1.config.statics)) {
            init_1.config.statics.forEach(path => app.use(serveStatic(path)));
        }
        else {
            for (let path in init_1.config.statics) {
                app.use(serveStatic(path, init_1.config.statics[path]));
            }
        }
    }
    else if (init_1.config.staticPath && fs.existsSync(init_1.config.staticPath)) {
        app.use(serveStatic(init_1.config.staticPath));
    }
}
exports.handleStatic = handleStatic;
//# sourceMappingURL=HttpStaticHandler.js.map