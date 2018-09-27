"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const init_1 = require("../../init");
const ConfigLoader_1 = require("./ConfigLoader");
const HttpController_1 = require("../controllers/HttpController");
const WebSocketController_1 = require("../controllers/WebSocketController");
const functions_inner_1 = require("../tools/functions-inner");
let WS = ConfigLoader_1.config.server.websocket;
function isController(m) {
    return m && (m.prototype instanceof HttpController_1.HttpController
        || m.prototype instanceof WebSocketController_1.WebSocketController);
}
function loadControllers(controllerPath) {
    var files = fs.readdirSync(controllerPath);
    for (let file of files) {
        let filename = controllerPath + "/" + file;
        let stat = fs.statSync(filename);
        if (stat.isFile() && path.extname(file) == ".js") {
            let _module = require(filename), basename = path.basename(filename, ".js"), Class;
            if (isController(_module)) {
                Class = _module;
            }
            else if (_module[basename] && isController(_module[basename])) {
                Class = _module[basename];
            }
            else if (_module.default && isController(_module.default)) {
                Class = _module.default;
            }
            else {
                continue;
            }
            if (init_1.SRC_PATH !== init_1.APP_PATH) {
                let _filename = filename.substring(init_1.APP_PATH.length, filename.length - 3);
                _filename = path.normalize(init_1.SRC_PATH + _filename + ".ts");
                if (fs.existsSync(_filename)) {
                    filename = _filename;
                }
            }
            if (Class.prototype instanceof HttpController_1.HttpController) {
                let _class = Class;
                _class.filename = filename;
                if (ConfigLoader_1.config.enableDocRoute)
                    functions_inner_1.applyHttpControllerDoc(_class);
            }
            else if (WS.enabled && Class.prototype instanceof WebSocketController_1.WebSocketController) {
                let _class = Class;
                _class.filename = filename;
                if (ConfigLoader_1.config.enableDocRoute)
                    functions_inner_1.applyWebSocketControllerDoc(_class);
            }
        }
        else if (stat.isDirectory()) {
            loadControllers(filename);
        }
    }
}
for (let dir of ConfigLoader_1.config.controllers) {
    loadControllers(`${init_1.APP_PATH}/${dir}`);
}
//# sourceMappingURL=ControllerLoader.js.map