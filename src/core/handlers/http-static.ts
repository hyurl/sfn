import serveStatic = require("serve-static");
import { config } from "../bootstrap/ConfigLoader";
import { app } from "../bootstrap/index";

if (Array.isArray(config.statics)) {
    config.statics.forEach(path => app.use(<any>serveStatic(path)));
} else {
    for (let path in config.statics) {
        app.use(<any>serveStatic(path, config.statics[path]));
    }
}