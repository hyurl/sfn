"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = require("fs-extra");
const path = require("path");
const init_1 = require("../../init");
const ConfigLoader_1 = require("./ConfigLoader");
const HttpController_1 = require("../controllers/HttpController");
const WebSocketController_1 = require("../controllers/WebSocketController");
const functions_inner_1 = require("../tools/functions-inner");
let WS = ConfigLoader_1.config.server.websocket;
let ext = init_1.isTsNode ? ".ts" : ".js";
const tryImport = functions_inner_1.createImport(require);
function isController(m) {
    return m && (m.prototype instanceof HttpController_1.HttpController
        || m.prototype instanceof WebSocketController_1.WebSocketController);
}
function loadControllers(controllerPath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        var files = yield fs.readdir(controllerPath);
        for (let file of files) {
            let filename = controllerPath + "/" + file;
            let stat = yield fs.stat(filename);
            if (stat.isFile() && path.extname(file) == ext) {
                let _module = tryImport(filename), basename = path.basename(filename, ext), Class;
                if (isController(_module.default)) {
                    Class = _module.default;
                }
                else if (isController(_module[basename])) {
                    Class = _module[basename];
                }
                else if (isController(_module)) {
                    Class = _module;
                }
                else {
                    continue;
                }
                if (init_1.SRC_PATH !== init_1.APP_PATH) {
                    let _filename = filename.substring(init_1.APP_PATH.length, filename.length - 3);
                    _filename = path.normalize(init_1.SRC_PATH + _filename + ".ts");
                    if (yield fs.pathExists(_filename)) {
                        filename = _filename;
                    }
                }
                if (Class.prototype instanceof HttpController_1.HttpController) {
                    let _class = Class;
                    _class.filename = filename;
                }
                else if (WS.enabled && Class.prototype instanceof WebSocketController_1.WebSocketController) {
                    let _class = Class;
                    _class.filename = filename;
                }
            }
            else if (stat.isDirectory()) {
                loadControllers(filename);
            }
        }
    });
}
for (let dir of ConfigLoader_1.config.controllers) {
    loadControllers(`${init_1.APP_PATH}/${dir}`);
}
//# sourceMappingURL=ControllerLoader.js.map