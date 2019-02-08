import * as fs from "fs-extra";
import * as path from "path";
import { isTsNode, isDevMode } from "../../init";
import { HttpController } from "../controllers/HttpController";
import { WebSocketController } from "../controllers/WebSocketController";
import { createImport, callsiteLog } from '../tools/functions-inner';
import { ControllerContructor, Controller } from '../controllers/Controller';
import service from '../tools/Service';

const tryImport = createImport(require);
const Ext = isTsNode ? ".ts" : ".js";

async function loadControllers(controllerPath: string) {
    var files = await fs.readdir(controllerPath);

    for (let file of files) {
        let filename = path.resolve(controllerPath, file);
        let stat = await fs.stat(filename);

        if (stat.isFile() && path.extname(file) == Ext) {
            let ctor: typeof Controller = tryImport(filename).default;

            if (ctor) {
                try {
                    if (ctor.prototype instanceof WebSocketController) {
                        ctor.assign({ filename });
                    } else if (ctor.prototype instanceof HttpController) {
                        ctor.assign({ filename });
                    }
                } catch (err) {
                    if (isDevMode) {
                        callsiteLog(err);
                    } else {
                        service.logger.error(err.message);
                    }
                }
            }
        } else if (stat.isDirectory()) {
            // load files recursively.
            loadControllers(filename);
        }
    }
}

loadControllers(app.controllers.path);