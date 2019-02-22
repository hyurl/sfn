"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SSE = require("sfn-sse");
const chalk_1 = require("chalk");
const index_1 = require("../bootstrap/index");
const init_1 = require("../../init");
const functions_inner_1 = require("../tools/functions-inner");
const truncate = require("lodash/truncate");
const reqLogged = Symbol("reqLogged");
index_1.router.use(async (req, res, next) => {
    req["originalUrl"] = req.url;
    req.shortUrl = truncate(req.url, { length: 32 });
    req.isEventSource = SSE.isEventSource(req);
    res.headers["server"] = `NodeJS/${process.version}`;
    res.headers["x-powered-by"] = `sfn/${init_1.version}`;
    res.gzip = false;
    res.charset = "UTF-8";
    let logger = getDevLogger(req, res);
    res.on("finish", logger).on("close", logger);
    await next();
});
function logRequest(reqTime, type, code, url) {
    if (init_1.isDevMode) {
        var cost = Date.now() - reqTime, codeStr = code.toString(), level = "log", color = functions_inner_1.grey;
        type = chalk_1.default.bold(type);
        cost = chalk_1.default.cyan(`${cost}ms`);
        if (code < 200) {
            codeStr = chalk_1.default.blue(codeStr);
        }
        else if (code >= 200 && code < 300) {
            codeStr = chalk_1.default.green(codeStr);
        }
        else if (code >= 300 && code < 400) {
            codeStr = chalk_1.default.yellow(codeStr);
        }
        else {
            codeStr = chalk_1.default.red(codeStr);
            level = "error";
            color = functions_inner_1.red;
        }
        console[level](color `${type} ${url} ${codeStr} ${cost}`);
    }
}
exports.logRequest = logRequest;
function getDevLogger(req, res) {
    return () => {
        if (res[reqLogged])
            return;
        res[reqLogged] = true;
        let type = req.isEventSource ? "SSE" : req.method;
        logRequest(req.time, type, res.statusCode, req.shortUrl);
    };
}
;
//# sourceMappingURL=http-init.js.map