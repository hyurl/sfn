import * as chalk from "chalk";
import { SSE } from "sfn-sse";
import { router } from "../bootstrap/index";
import { version, isDevMode } from "../../init";
import { Request, Response } from "../tools/interfaces";
import { grey, red, green, yellow } from "../tools/internal/color";
import truncate = require("lodash/truncate");

const reqLogged = Symbol("reqLogged");

router.use(async (req: Request, res: Response, next) => {
    req["originalUrl"] = req.url; // compatible with Express framework.
    req.shortUrl = truncate(req.url, { length: 32 });
    req.isEventSource = SSE.isEventSource(req);
    res.headers["server"] = `NodeJS/${process.version}`;
    res.headers["x-powered-by"] = `sfn/${version}`;
    res.gzip = false;
    res.sent = false;

    if (req.isEventSource) {
        res.sse = new SSE(req, res);

        // If the SSE connection has been marked closed, return immediately and
        // do not continue HTTP controlling life cycle.
        if (res.sse.isClosed)
            return;

        app.sse.set(res.sse.id, res.sse);
    }

    if (req.lang) {
        let names = req.lang.split("-");

        if (names.length > 1) {
            req.lang = names[0] + "-" + names[1].toUpperCase();
        }
    }

    let logger = getDevLogger(req, res);
    let clearSSE = () => {
        res.sse && app.sse.delete(res.sse.id);
    };

    res.on("finish", logger)
        .on("finish", clearSSE)
        .on("close", logger)
        .on("close", clearSSE);

    await next();
});

export function logRequest(reqTime: number, type: string, code: number, url: string): void {
    if (isDevMode || code >= 500 || app.argv["log-request"] === true) {
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
            color = green;
        } else if (code >= 300 && code < 400) {
            codeStr = chalk.yellow(codeStr);
            color = yellow;
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
        if (res[reqLogged])
            return;

        res[reqLogged] = true;
        let type = req.isEventSource ? "SSE" : req.method;
        logRequest(req.time, type, res.statusCode, req.shortUrl);
    };
};