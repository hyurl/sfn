"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const init_1 = require("../../init");
const load_config_1 = require("./load-config");
const HttpController_1 = require("../controllers/HttpController");
const WebSocketController_1 = require("../controllers/WebSocketController");
const functions_inner_1 = require("../tools/functions-inner");
let WS = load_config_1.config.server.websocket;
let Ext = init_1.isTsNode ? ".ts" : ".js";
const tryImport = functions_inner_1.createImport(require);
function isController(m) {
    return m && (m.prototype instanceof HttpController_1.HttpController
        || m.prototype instanceof WebSocketController_1.WebSocketController);
}
async function loadControllers(controllerPath) {
    var files = await fs.readdir(controllerPath);
    for (let file of files) {
        let filename = controllerPath + "/" + file;
        let stat = await fs.stat(filename);
        if (stat.isFile() && path.extname(file) == Ext) {
            let _module = tryImport(filename), basename = path.basename(filename, Ext), Class;
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
                if (await fs.pathExists(_filename)) {
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
}
for (let dir of load_config_1.config.controllers) {
    loadControllers(`${init_1.APP_PATH}/${dir}`);
}
//# sourceMappingURL=load-controller.js.map