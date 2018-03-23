import SSE = require("sfn-sse");
import * as date from "sfn-date";
import { App } from "webium";
import { config, version } from "../../init";
import { Request, Response } from "../tools/interfaces";
import { realDB } from '../Tools/symbols';

function getDevLogger(req: Request, res: Response) {
    return () => {
        if (config.env === "dev") {
            // dev mode log out request info.
            var cost: number | string = Date.now() - req.time,
                dateTime: string = `[${date("Y-m-d H:i:s.ms")}]`.cyan,
                type: string = <any>(req.isEventSource ? "SSE" : req.method).bold,
                url: string = req.shortUrl.yellow,
                code: number = res.statusCode,
                codeStr: string = res.statusCode.toString();

            cost = `${cost}ms`.cyan;

            if (code < 200) {
                codeStr = codeStr.cyan;
            } else if (code >= 200 && code < 300) {
                codeStr = codeStr.green;
            } else if (code >= 300 && code < 400) {
                codeStr = codeStr.yellow;
            } else {
                codeStr = codeStr.red;
            }

            console.log(`${dateTime} ${type} ${url} ${codeStr} ${cost}`);
        }
    };
};

export function handleHttpInit(app: App): void {
    app.use(async (req: Request, res: Response, next) => {
        req.isEventSource = SSE.isEventSource(req);
        res.headers["server"] = `Node.js/${process.version}`;
        res.headers["x-powered-by"] = `sfn/${version}`;
        res.gzip = false;

        if (req.url.length > 64) {
            // If URL is too long, cut down exceeding part.
            req.shortUrl = req.url.substring(0, 61) + "...";
        } else {
            req.shortUrl = req.url;
        }

        let logger = getDevLogger(req, res);
        res.on("finish", logger).on("close", logger);

        await next();
    });
}