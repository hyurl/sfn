"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const zlib = require("zlib");
const cors = require("sfn-cors");
const modelar_1 = require("modelar");
const values = require("lodash/values");
const init_1 = require("../../init");
const index_1 = require("../bootstrap/index");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
const HttpController_1 = require("../controllers/HttpController");
const HttpError_1 = require("../tools/HttpError");
const functions_1 = require("../tools/functions");
const functions_inner_1 = require("../tools/functions-inner");
const symbols_1 = require("../tools/symbols");
const RouteMap_1 = require("../tools/RouteMap");
const EFFECT_METHODS = [
    "DELETE",
    "PATCH",
    "POST",
    "PUT"
];
index_1.app.onerror = function onerror(err, req, res) {
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
function getRouteHandler(route) {
    return (req, res) => {
        let { Class, method } = RouteMap_1.RouteMap[route], ctrl = null;
        res.on("error", (err) => {
            handleLog(err, ctrl, method);
        });
        new Promise((resolve, reject) => {
            try {
                let handleNext = getNextHandler(method, resolve, reject);
                if (Class.length === 3) {
                    ctrl = new Class(req, res, handleNext);
                }
                else {
                    ctrl = new Class(req, res);
                    handleNext(ctrl);
                }
            }
            catch (err) {
                reject(err);
            }
        }).then((data) => {
            return handleResponse(ctrl, data);
        }).then(() => {
            return ctrl.after();
        }).then(result => {
            return result === false
                ? result
                : functions_inner_1.callIntercepterChain(Class.AfterIntercepters[method], ctrl);
        }).catch((err) => {
            ctrl = ctrl || new HttpController_1.HttpController(req, res);
            handleError(err, ctrl, method);
        });
    };
}
exports.getRouteHandler = getRouteHandler;
function getNextHandler(method, resolve, reject) {
    return (ctrl) => {
        let { req, res } = ctrl, { BeforeIntercepters, RequireAuth } = ctrl.Class;
        new Promise((_resolve, _reject) => {
            if (!cors(ctrl.cors, req, res)) {
                return _reject(new HttpError_1.HttpError(410));
            }
            else if (req.method === "OPTIONS") {
                res.end();
                return _resolve(false);
            }
            handleCsrfToken(ctrl);
            _resolve(null);
        }).then(result => {
            if (result === false || res.sent)
                return false;
            else
                return ctrl.before();
        }).then(result => {
            if (result === false || res.sent)
                return false;
            else
                return functions_inner_1.callIntercepterChain(BeforeIntercepters[method], ctrl, true);
        }).then(result => {
            if (result === false || res.sent) {
                return resolve(null);
            }
            if (RequireAuth.includes(method) && !ctrl.authorized) {
                if (ctrl.fallbackTo) {
                    return res.redirect(ctrl.fallbackTo, 302);
                }
                else {
                    throw new HttpError_1.HttpError(401);
                }
            }
            res.gzip = req.encoding == "gzip" && ctrl.gzip;
            if (req.method == "GET" && ctrl.jsonp
                && req.query[ctrl.jsonp]) {
                res.jsonp = req.query[ctrl.jsonp];
            }
            return getResult(ctrl, method);
        }).then(resolve).catch(reject);
    };
}
function handleLog(err, ctrl, method) {
    if (ConfigLoader_1.config.server.error.log) {
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
    if (ConfigLoader_1.isDevMode && !(err instanceof HttpError_1.HttpError)) {
        functions_inner_1.callsiteLog(err);
    }
}
function handleError(err, ctrl, method) {
    let { req, res } = ctrl;
    if (res.sent)
        return handleFinish(err, ctrl, method);
    if (err instanceof HttpError_1.HttpError && err.code == 405 && req.isEventSource)
        err = new HttpError_1.HttpError(204);
    let _err = err;
    if (!(err instanceof HttpError_1.HttpError)) {
        if (err instanceof Error && ConfigLoader_1.config.server.error.show)
            err = new HttpError_1.HttpError(500, err.message);
        else
            err = new HttpError_1.HttpError(500);
    }
    if (req.accept == "application/json" || res.jsonp) {
        res.send(ctrl.error(err.message, err.code));
        handleFinish(_err, ctrl, method);
    }
    else {
        res.status = err.code;
        ctrl.Class.httpErrorView(err, ctrl).then(content => {
            res.type = "text/html";
            res.send(content);
            handleFinish(_err, ctrl, method);
        }).catch(() => {
            res.type = "text/plain";
            res.send(err.message);
            handleFinish(_err, ctrl, method);
        });
    }
}
function getResult(ctrl, method) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return functions_inner_1.callMethod(ctrl, ctrl[method], ...(yield getArguments(ctrl, method)));
    });
}
function getArguments(ctrl, method) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let { req, res } = ctrl, data = values(req.params), args = [], fnParams = functions_inner_1.getFuncParams(ctrl[method]), reqParams = ["request", "req"], resParams = ["response", "res"];
        if (init_1.isTypeScript) {
            let meta = Reflect.getMetadata("design:paramtypes", ctrl, method);
            for (let i = 0; i < meta.length; i++) {
                if (meta[i] == Number) {
                    args[i] = parseInt(data.shift());
                }
                else if (meta[i] == Boolean) {
                    let val = data.shift();
                    args[i] = val == "false" || val == "0" ? false : true;
                }
                else if (meta[i] == Object) {
                    if (reqParams.includes(fnParams[i]))
                        args[i] = req;
                    else if (resParams.includes(fnParams[i]))
                        args[i] = res;
                    else
                        args[i] = data.shift();
                }
                else if (meta[i].prototype instanceof modelar_1.Model) {
                    if (req.method == "POST" && req.params.id === undefined) {
                        args[i] = (new meta[i]).use(req.db);
                    }
                    else {
                        try {
                            let id = parseInt(req.params.id);
                            if (!id || isNaN(id))
                                throw new HttpError_1.HttpError(400);
                            args[i] = yield meta[i].use(req.db).get(id);
                        }
                        catch (e) {
                            args[i] = null;
                            throw e;
                        }
                    }
                }
                else {
                    args[i] = data.shift();
                }
            }
        }
        else {
            for (let i = 0; i < fnParams.length; i++) {
                if (reqParams.includes(fnParams[i]))
                    args[i] = req;
                else if (resParams.includes(fnParams[i]))
                    args[i] = res;
                else
                    args[i] = data.shift();
            }
        }
        return args;
    });
}
function handleResponse(ctrl, data) {
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
                return handleGzip(ctrl, data);
            }
            else {
                res.send(data);
            }
        }
    }
    return finish(ctrl);
}
function handleGzip(ctrl, data) {
    return new Promise((resolve, reject) => {
        let { res } = ctrl;
        zlib.gzip(data, (err, _data) => {
            if (err)
                return reject(err);
            res.headers["content-encoding"] = "gzip";
            res.type = "text/html";
            res.end(_data);
            resolve(null);
        });
    }).then(() => {
        return finish(ctrl);
    });
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