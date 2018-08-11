import { App } from "webium";
import { config } from "../../index";
import { Request, Response } from "../tools/interfaces";

export function redirectHttps(app: App): void {
    if (config.server.https.enabled && config.server.https.forceRedirect) {
        app.use(async (req: Request, res: Response, next) => {
            if (req.protocol !== "https") {
                let host = req.hostname + ":" + config.server.https.port;
                res.redirect(`https://${host}${req.url}`, 301);
            } else {
                await next();
            }
        });
    }
}