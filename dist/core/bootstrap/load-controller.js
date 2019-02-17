"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const init_1 = require("../../init");
const HttpController_1 = require("../controllers/HttpController");
const WebSocketController_1 = require("../controllers/WebSocketController");
const functions_inner_1 = require("../tools/functions-inner");
const tryImport = functions_inner_1.createImport(require);
const Ext = init_1.isTsNode ? ".ts" : ".js";
async function loadControllers(controllerPath) {
    var files = await fs.readdir(controllerPath);
    for (let file of files) {
        let filename = path.resolve(controllerPath, file);
        let stat = await fs.stat(filename);
        if (stat.isFile() && path.extname(file) == Ext) {
            let ctor = tryImport(filename).default;
            if (ctor && ((ctor.prototype instanceof WebSocketController_1.WebSocketController) ||
                (ctor.prototype instanceof HttpController_1.HttpController))) {
                ctor.assign({ filename });
            }
        }
        else if (stat.isDirectory()) {
            loadControllers(filename);
        }
    }
}
loadControllers(app.controllers.path);
//# sourceMappingURL=load-controller.js.map