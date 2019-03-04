import SSE = require("sfn-sse");
import chalk from "chalk";
import { router } from "../bootstrap/index";
import { version, isDevMode } from "../../init";
import { Request, Response } from "../tools/interfaces";
import { grey, red } from "../tools/functions-inner";
import truncate = require("lodash/truncate");
import sequid from "sequid";

const reqLogged = Symbol("reqLogged");
const requestId = sequid();

router.use(async (req: Request, res: Response, next) => {
    req.id = requestId.next().value;
    req["originalUrl"] = req.url; // compatible with Express framework.
    req.shortUrl = truncate(req.url, { length: 32 });
    req.isEventSource = SSE.isEventSource(req);
    res.headers["server"] = `NodeJS/${process.version}`;
    res.headers["x-powered-by"] = `sfn/${version}`;
    res.gzip = false;
    res.sent = false;

    if (req.isEventSource) {
        res.sse = new SSE(req, res);
        app.sse[req.id] = res.sse;
    } else {
        res.charset = "UTF-8";
    }

    let logger = getDevLogger(req, res);
    let clearSSE = () => {
        delete app.sse[req.id];
    }

    res.on("finish", logger)
        .on("finish", clearSSE)
        .on("close", logger)
        .on("close", clearSSE);

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