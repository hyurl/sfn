"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const init_1 = require("../../init");
const HttpController_1 = require("../controllers/HttpController");
const WebSocketController_1 = require("../controllers/WebSocketController");
const functions_inner_1 = require("../tools/functions-inner");
const Service_1 = require("../tools/Service");
const tryImport = functions_inner_1.createImport(require);
const Ext = init_1.isTsNode ? ".ts" : ".js";
function checkFilename(ctor, filename) {
    filename = filename.slice(0, -3) + ".ts";
    if (!ctor.filename) {
        throw new TypeError(`The controller in ${filename} must define 'filename' explicitly.`);
    }
}
async function loadControllers(controllerPath) {
    var files = await fs.readdir(controllerPath);
    for (let file of files) {
        let filename = path.resolve(controllerPath, file);
        let stat = await fs.stat(filename);
        if (stat.isFile() && path.extname(file) == Ext) {
            let ctor = tryImport(filename).default;
            if (ctor) {
                try {
                    if (ctor.prototype instanceof WebSocketController_1.WebSocketController) {
                        checkFilename(ctor, filename);
                    }
                    else if (ctor.prototype instanceof HttpController_1.HttpController) {
                        checkFilename(ctor, filename);
                    }
                }
                catch (err) {
                    if (init_1.isDevMode) {
                        functions_inner_1.callsiteLog(err);
                    }
                    else {
                        Service_1.default.logger.error(err.message);
                    }
                }
            }
        }
        else if (stat.isDirectory()) {
            loadControllers(filename);
        }
    }
}
loadControllers(app.controllers.path);
//# sourceMappingURL=load-controller.js.map