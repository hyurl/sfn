import * as fs from "fs";
import * as path from "path";
import { APP_PATH, SRC_PATH, isTsNode } from "../../init";
import { config } from "./ConfigLoader";
import { HttpController } from "../controllers/HttpController";
import { WebSocketController } from "../controllers/WebSocketController";

let WS = config.server.websocket;
let ext = isTsNode ? ".ts" : ".js";

function isController(m): boolean {
    return m && (m.prototype instanceof HttpController
        || m.prototype instanceof WebSocketController);
}

function loadControllers(controllerPath: string) {
    var files = fs.readdirSync(controllerPath);

    for (let file of files) {
        let filename = controllerPath + "/" + file;
        let stat = fs.statSync(filename);

        if (stat.isFile() && path.extname(file) == ext) {
            let _module = require(filename),
                basename: string = path.basename(filename, ext),
                Class: typeof HttpController | typeof WebSocketController;

            if (_module.default && isController(_module.default)) {
                // export default class Controller { }
                Class = _module.default;
            } else if (_module[basename] && isController(_module[basename])) {
                // export class Controller { }
                Class = _module[basename];
            } else if (isController(_module)) {
                // export = Controller
                Class = _module;
            } else {
                continue;
            }

            if (SRC_PATH !== APP_PATH) {
                let _filename = filename.substring(APP_PATH.length, filename.length - 3);
                _filename = path.normalize(SRC_PATH + _filename + ".ts");

                if (fs.existsSync(_filename)) {
                    filename = _filename;
                }
            }

            if (Class.prototype instanceof HttpController) {
                let _class = <typeof HttpController>Class;
                _class.filename = filename;

            } else if (WS.enabled && Class.prototype instanceof WebSocketController) {
                let _class = <typeof WebSocketController>Class;
                _class.filename = filename;
            }
        } else if (stat.isDirectory()) {
            // load files recursively.
            loadControllers(filename);
        }
    }
}

for (let dir of config.controllers) {
    loadControllers(`${APP_PATH}/${dir}`);
}