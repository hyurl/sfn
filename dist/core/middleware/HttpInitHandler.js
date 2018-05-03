"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const SSE = require("sfn-sse");
const date = require("sfn-date");
const chalk_1 = require("chalk");
const init_1 = require("../../init");
function getDevLogger(req, res) {
    return () => {
        if (init_1.isDevMode) {
            var cost = Date.now() - req.time, dateTime = chalk_1.default.cyan(`[${date("Y-m-d H:i:s.ms")}]`), type = chalk_1.default.bold(req.isEventSource ? "SSE" : req.method), url = chalk_1.default.yellow(req.shortUrl), code = res.statusCode, codeStr = res.statusCode.toString();
            cost = chalk_1.default.cyan(`${cost}ms`);
            if (code < 200) {
                codeStr = chalk_1.default.cyan(codeStr);
            }
            else if (code >= 200 && code < 300) {
                codeStr = chalk_1.default.green(codeStr);
            }
            else if (code >= 300 && code < 400) {
                codeStr = chalk_1.default.yellow(codeStr);
            }
            else {
                codeStr = chalk_1.default.red(codeStr);
            }
            console.log(`${dateTime} ${type} ${url} ${codeStr} ${cost}`);
        }
    };
}
;
function handleHttpInit(app) {
    app.use((req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        req.isEventSource = SSE.isEventSource(req);
        res.headers["server"] = `Node.js/${process.version}`;
        res.headers["x-powered-by"] = `sfn/${init_1.version}`;
        res.gzip = false;
        if (req.url.length > 64) {
            req.shortUrl = req.url.substring(0, 61) + "...";
        }
        else {
            req.shortUrl = req.url;
        }
        let logger = getDevLogger(req, res);
        res.on("finish", logger).on("close", logger);
        yield next();
    }));
}
exports.handleHttpInit = handleHttpInit;
//# sourceMappingURL=HttpInitHandler.js.map