import serveStatic = require("serve-static");
import { config } from "../bootstrap/load-config";
import { app } from "../bootstrap/index";
import startsWith = require("lodash/startsWith");
import { resolve } from "path";
import { SRC_PATH } from '../../init';
import { Request } from '../tools/interfaces';

if (Array.isArray(config.statics)) {
    config.statics.forEach(path => {
        app.use(<any>serveStatic(resolve(SRC_PATH, path)));
    });
} else {
    for (let path in config.statics) {
        let options = config.statics[path],
            _path = resolve(SRC_PATH, path),
            handle = serveStatic(_path, options);

        app.use(async (req: Request, res, next) => {
            if (options.prefix) {
                let prefix = typeof options.prefix == "string"
                    ? options.prefix
                    : _path.slice(SRC_PATH.length);

                if (startsWith(req.url, prefix + "/")) {
                    req.url = req.url.slice(prefix.length);

                    return handle(<any>req, <any>res, () => {
                        req.url = req["originalUrl"];
                        next();
                    });
                } else {
                    next();
                }
            } else {
                handle(<any>req, <any>res, next);
            }
        });
    }
}