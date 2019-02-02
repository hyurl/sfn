import * as fs from "fs-extra";
import * as path from "path";
import { APP_PATH, SRC_PATH, isTsNode } from "../../init";
import { config } from "./load-config";
import { HttpController } from "../controllers/HttpController";
import { WebSocketController } from "../controllers/WebSocketController";
import { createImport } from '../tools/functions-inner';

let WS = config.server.websocket;
let Ext = isTsNode ? ".ts" : ".js";
const tryImport = createImport(require);

function isController(m): boolean {
    return m && (m.prototype instanceof HttpController
        || m.prototype instanceof WebSocketController);
}

async function loadControllers(controllerPath: string) {
    var files = await fs.readdir(controllerPath);

    for (let file of files) {
        let filename = controllerPath + "/" + file;
        let stat = await fs.stat(filename);

        if (stat.isFile() && path.extname(file) == Ext) {
            let _module = tryImport(filename),
                basename: string = path.basename(filename, Ext),
                Class: typeof HttpController | typeof WebSocketController;

            if (isController(_module.default)) {
                // export default class Controller { }
                Class = _module.default;
            } else if (isController(_module[basename])) {
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

                if (await fs.pathExists(_filename)) {
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