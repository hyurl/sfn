"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serveStatic = require("serve-static");
const fs = require("fs");
const index_1 = require("../../index");
function handleStatic(app) {
    if (index_1.config.statics) {
        if (Array.isArray(index_1.config.statics)) {
            index_1.config.statics.forEach(path => app.use(serveStatic(path)));
        }
        else {
            for (let path in index_1.config.statics) {
                app.use(serveStatic(path, index_1.config.statics[path]));
            }
        }
    }
    else if (index_1.config.staticPath && fs.existsSync(index_1.config.staticPath)) {
        app.use(serveStatic(index_1.config.staticPath));
    }
}
exports.handleStatic = handleStatic;
//# sourceMappingURL=HttpStaticHandler.js.map