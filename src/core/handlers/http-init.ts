import SSE = require("sfn-sse");
import chalk from "chalk";
import { router } from "../bootstrap/index";
import { version, isDevMode } from "../../init";
import { Request, Response } from "../tools/interfaces";
import { grey, red } from "../tools/functions-inner";
import truncate = require("lodash/truncate");

const reqLogged = Symbol("reqLogged");

router.use(async (req: Request, res: Response, next) => {
    req["originalUrl"] = req.url; // compatible with Express framework.
    req.shortUrl = truncate(req.url, { length: 32 });
    req.isEventSource = SSE.isEventSource(req);
    res.headers["server"] = `NodeJS/${process.version}`;
    res.headers["x-powered-by"] = `sfn/${version}`;
    res.gzip = false;

    let logger = getDevLogger(req, res);
    res.on("finish", logger).on("close", logger);

    await next();
});

export function logRequest(reqTime: number, type: string, code: number, url: string): void {
    if (isDevMode) {
        // dev mode log out request info.
        var cost: number | string = Date.now() - reqTime,
            codeStr = code.toString(),
            level = "log",
            color: Function = grey;

        type = chalk.bold(type);
        cost = chalk.cyan(`${cost}ms`);

        if (code < 200) {
            codeStr = chalk.blue(codeStr);
        } else if (code >= 200 && code < 300) {
            codeStr = chalk.green(codeStr);
        } else if (code >= 300 && code < 400) {
            codeStr = chalk.yellow(codeStr);
        } else {
            codeStr = chalk.red(codeStr);
            level = "error";
            color = red;
        }

        console[level](color`${type} ${url} ${codeStr} ${cost}`);
    }
}

function getDevLogger(req: Request, res: Response) {
    return () => {
        if (res[reqLogged]) return;
        res[reqLogged] = true;
        let type = req.isEventSource ? "SSE" : req.method;
        logRequest(req.time, type, res.statusCode, req.shortUrl);
    };
};