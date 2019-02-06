import * as fs from "fs-extra";
import * as path from "path";
import { isTsNode, isDevMode } from "../../init";
import { HttpController } from "../controllers/HttpController";
import { WebSocketController } from "../controllers/WebSocketController";
import { createImport, callsiteLog } from '../tools/functions-inner';
import { ControllerContructor } from '../controllers/Controller';
import service from '../tools/Service';

const tryImport = createImport(require);
const Ext = isTsNode ? ".ts" : ".js";

function checkFilename(ctor: ControllerContructor, filename: string) {
    filename = filename.slice(0, -3) + ".ts";
    if (!ctor.filename) {
        throw new TypeError(
            `The controller in ${filename} must define 'filename' explicitly.`
        );
    }
}

async function loadControllers(controllerPath: string) {
    var files = await fs.readdir(controllerPath);

    for (let file of files) {
        let filename = path.resolve(controllerPath, file);
        let stat = await fs.stat(filename);

        if (stat.isFile() && path.extname(file) == Ext) {
            let ctor = tryImport(filename).default;

            if (ctor) {
                try {
                    if (ctor.prototype instanceof WebSocketController) {
                        checkFilename(ctor, filename);
                    } else if (ctor.prototype instanceof HttpController) {
                        checkFilename(ctor, filename);
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