import SSE = require("sfn-sse");
import * as date from "sfn-date";
import chalk from "chalk";
import { App } from "webium";
import { version, isDevMode } from "../../init";
import { Request, Response } from "../tools/interfaces";

function getDevLogger(req: Request, res: Response) {
    return () => {
        if (isDevMode) {
            // dev mode log out request info.
            var cost: number | string = Date.now() - req.time,
                dateTime: string = chalk.cyan(`[${date("Y-m-d H:i:s.ms")}]`),
                type: string = chalk.bold(req.isEventSource ? "SSE" : req.method),
                code: number = res.statusCode,
                codeStr: string = res.statusCode.toString();

            cost = chalk.cyan(`${cost}ms`);

            if (code < 200) {
                codeStr = chalk.blue(codeStr);
            } else if (code >= 200 && code < 300) {
                codeStr = chalk.green(codeStr);
            } else if (code >= 300 && code < 400) {
                codeStr = chalk.yellow(codeStr);
            } else {
                codeStr = chalk.red(codeStr);
            }

            console.log(`${dateTime} ${type} ${req.shortUrl} ${codeStr} ${cost}`);
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