import serveStatic = require("serve-static");
import * as fs from "fs";
import { App } from "webium";
import { config } from "../../init";
import { Request, Response } from "../tools/interfaces";

export function handleStatic(app: App): void {
    let dir = config.staticPath;
    if (dir && fs.existsSync(dir)) {
        app.use(<any>serveStatic(dir));
    }
}