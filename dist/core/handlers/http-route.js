"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zlib = require("zlib");
const cors = require("sfn-cors");
const values = require("lodash/values");
const modelar_1 = require("modelar");
const index_1 = require("../bootstrap/index");
const HttpController_1 = require("../controllers/HttpController");
const HttpError_1 = require("../tools/HttpError");
const functions_1 = require("../tools/functions");
const functions_inner_1 = require("../tools/functions-inner");
const interfaces_1 = require("../tools/interfaces");
const symbols_1 = require("../tools/symbols");
const init_1 = require("../../init");
const RouteMap_1 = require("../tools/RouteMap");
const literal_toolkit_1 = require("literal-toolkit");
const EFFECT_METHODS = [
    "DELETE",
    "PATCH",
    "POST",
    "PUT"
];
index_1.router.onerror = function onerror(err, req, res) {
    res.keepAlive = false;
    let ctrl = new HttpController_1.HttpController(req, res);
    if (res.statusCode === 404)
        err = new HttpError_1.HttpError(404);
    else if (res.statusCode === 405)
        err = new HttpError_1.HttpError(405);
    else if (err instanceof Error)
        err = new HttpError_1.HttpError(500, err.message);
    else if (typeof err === "string")
        err = new HttpError_1.HttpError(500, err);
    else
        err = new HttpError_1.HttpError(500);
    handleError(err, ctrl, req.method + " " + req.url);
};
function getRouteHandler(key) {
    return async (req, res) => {
        let mod = RouteMap_1.routeMap.resolve(key), methods = RouteMap_1.routeMap.methods(key), ctrl = null, initiated = false;
        res.on("error", (err) => {
            handleLog(err, ctrl);
        });
        try {
            ctrl = mod.create(req, res);
            for (let method of methods) {
                if (!functions_inner_1.isOwnMethod(ctrl, method)) {
                    RouteMap_1.routeMap.del(key, method);
                    continue;
                }
                else if (!initiated) {
                    initiated = true;
                    if (!cors(ctrl.cors, req, res)) {
                        throw new HttpError_1.HttpError(410);
                    }
                    else if (req.method === "OPTIONS") {
                        res.end();
                    }
                    handleCsrfToken(ctrl);
                    if (false === (await ctrl.before()))
                        return;
                    res.gzip = req.encoding == "gzip" && ctrl.gzip;
                    if (req.method == "GET" && ctrl.jsonp && req.query[ctrl.jsonp]) {
                        res.jsonp = req.query[ctrl.jsonp];
                    }
                }
                let result = await ctrl[method](...await getArguments(ctrl, method));
                await handleResponse(ctrl, result);
            }
            if (initiated) {
                await ctrl.after();
                finish(ctrl);
            }
        }
        catch (err) {
            ctrl = ctrl || new HttpController_1.HttpController(req, res);
            handleError(err, ctrl);
        }
    };
}
exports.getRouteHandler = getRouteHandler;
function handleLog(err, ctrl, method) {
    if (err instanceof HttpError_1.HttpError && err.code < 500)
        return;
    if (init_1.isDevMode) {
        functions_inner_1.callsiteLog(err);
    }
    else {
        let msg = err.toString(), stack;
        if (method && method.indexOf(" ") > 0) {
            stack = method;
        }
        else {
            let i = err.stack.indexOf("\n") + 1;
            stack = (err.stack.slice(i, err.stack.indexOf("\n", i))).trim();
            method && (stack = stack.replace("<anonymous>", method));
            stack = stack.replace("_1", "").slice(3);
        }
        ctrl.logger.hackTrace(stack);
        ctrl.logger.error(msg);
    }
}
exports.handleLog = handleLog;
function handleFinish(err, ctrl, method) {
    handleLog(err, ctrl, method);
    finish(ctrl);
}
async function handleError(err, ctrl, method) {
    let { req, res } = ctrl;
    if (res.sent)
        return handleFinish(err, ctrl, method);
    let _err;
    if (err instanceof HttpError_1.HttpError) {
        _err = err.code == 405 && req.isEventSource ? new HttpError_1.HttpError(204) : err;
    }
    else if (err instanceof Error && init_1.isDevMode) {
        _err = new HttpError_1.HttpError(500, err.message);
    }
    else {
        _err = new HttpError_1.HttpError(500);
    }
    if (req.accept == "application/json" || res.jsonp) {
        res.send(ctrl.error(_err.message, _err.code));
    }
    else {
        res.status = _err.code;
        try {
            let content = await ctrl.Class.httpErrorView(_err, ctrl);
            res.type = "text/html";
            res.send(content);
        }
        catch (err) {
            res.type = "text/plain";
            res.send(err.message);
        }
    }
    handleFinish(err, ctrl, method);
}
async function getArguments(ctrl, method) {
    let { req, res } = ctrl, data = values(req.params), args = [];
    let meta = Reflect.getMetadata("design:paramtypes", ctrl, method);
    for (let type of meta) {
        if (type === Number) {
            args.push(literal_toolkit_1.number.parse(data.shift()));
        }
        else if (type === Boolean) {
            let val = data.shift();
            args.push(val == "false" || val == "0" ? false : true);
        }
        else if (type === interfaces_1.Request) {
            args.push(req);
        }
        else if (type === interfaces_1.Response) {
            args.push(res);
        }
        else if (type === interfaces_1.Session) {
            args.push(req.session);
        }
        else if (type.prototype instanceof modelar_1.Model) {
            if (req.method == "POST" && req.params.id === undefined) {
                args.push((new type).use(req.db));
            }
            else {
                try {
                    let id = literal_toolkit_1.number.parse(req.params.id);
                    if (!id || isNaN(id))
                        throw new HttpError_1.HttpError(400);
                    args.push(await type.use(req.db).get(id));
                }
                catch (e) {
                    args.push(null);
                }
            }
        }
        else {
            args.push(data.shift());
        }
    }
    return args;
}
async function handleResponse(ctrl, data) {
    let { req, res } = ctrl;
    if (!res.sent) {
        if (req.isEventSource) {
            if (data !== null && data !== undefined)
                ctrl.sse.send(data);
        }
        else if (req.method === "HEAD") {
            res.end();
        }
        else if (data !== undefined) {
            let xml = /(text|application)\/xml\b/;
            let type = res.getHeader("Content-Type");
            if (data === null) {
                res.end("");
            }
            else if (typeof data === "object" && type && xml.test(type)) {
                res.xml(data);
            }
            else if (data instanceof Buffer) {
                res.send(data);
            }
            else if (typeof data === "string" && res.gzip) {
                await handleGzip(ctrl, data);
            }
            else {
                res.send(data);
            }
        }
    }
}
async function handleGzip(ctrl, data) {
    let { res } = ctrl;
    data = await new Promise((resolve, reject) => {
        zlib.gzip(data, (err, data) => err ? reject(err) : resolve(data));
    });
    res.headers["content-encoding"] = "gzip";
    res.type = "text/html";
    res.end(data);
}
function finish(ctrl) {
    ctrl.emit("finish", ctrl.req, ctrl.res);
}
function handleCsrfToken(ctrl) {
    if (!ctrl.csrfProtection || !ctrl.req.session)
        return;
    let { req, res } = ctrl;
    if (req.method == "GET") {
        if (!req.session.csrfTokens)
            req.session.csrfTokens = {};
        Object.defineProperty(req, "csrfToken", {
            set(v) {
                req[symbols_1.realCsrfToken] = v;
                req.session.csrfTokens[req.url] = v;
                res.set("X-CSRF-Token", v);
            },
            get() {
                if (!req[symbols_1.realCsrfToken])
                    req.csrfToken = functions_1.randStr(64);
                return req[symbols_1.realCsrfToken];
            }
        });
    }
    else if (EFFECT_METHODS.includes(req.method)) {
        if (!req.headers.referer) {
            throw new HttpError_1.HttpError(403);
        }
        let ref = req.headers.referer, tokens = req.session.csrfTokens, token = tokens && tokens[ref];
        if (token === undefined || (req.headers["x-csrf-token"] != token
            && req.query["x-csrf-token"] != token
            && req.body["x-csrf-token"] != token)) {
            throw new HttpError_1.HttpError(403);
        }
        else {
            Object.defineProperty(req, "csrfToken", {
                set(v) {
                    if (v === null || v === undefined)
                        delete tokens[ref];
                },
                get() {
                    return tokens[ref];
                }
            });
        }
    }
}
//# sourceMappingURL=http-route.js.map