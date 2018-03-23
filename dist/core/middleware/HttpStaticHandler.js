"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serveStatic = require("serve-static");
const fs = require("fs");
const init_1 = require("../../init");
function handleStatic(app) {
    let dir = init_1.config.staticPath;
    if (dir && fs.existsSync(dir)) {
        app.use(serveStatic(dir));
    }
}
exports.handleStatic = handleStatic;
//# sourceMappingURL=HttpStaticHandler.js.map