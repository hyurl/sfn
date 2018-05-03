import serveStatic = require("serve-static");
import * as fs from "fs";
import { App } from "webium";
import { config } from "../../init";

export function handleStatic(app: App): void {
    if (config.statics) {
        if (Array.isArray(config.statics)) {
            config.statics.forEach(path => app.use(<any>serveStatic(path)));
        } else {
            for (let path in config.statics) {
                app.use(<any>serveStatic(path, config.statics[path]));
            }
        }
    } else if (config.staticPath && fs.existsSync(config.staticPath)) {
        app.use(<any>serveStatic(config.staticPath));
    }
}