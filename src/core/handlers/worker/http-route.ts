import * as zlib from "zlib";
import * as cors from "sfn-cors";
import { Model } from 'modelar';
import values = require("lodash/values");
import { RouteHandler } from "webium";
import { isTypeScript } from '../../../init';
import { app } from "../../bootstrap/index";
import { config, isDevMode } from "../../bootstrap/ConfigLoader";
import { Controller } from "../../controllers/Controller";
import { HttpController } from "../../controllers/HttpController";
import { HttpError } from "../../tools/HttpError";
import { randStr } from "../../tools/functions";
import { callsiteLog, callMethod, getFuncParams, callIntercepterChain } from "../../tools/functions-inner";
import { Request, Response } from "../../tools/interfaces";
import { realCsrfToken } from "../../tools/symbols";
import { RouteMap } from "../../tools/RouteMap";

const EFFECT_METHODS: string[] = [
    "DELETE",
    "PATCH",
    "POST",
    "PUT"
];

app.onerror = function onerror(err: any, req: Request, res: Response) {
    res.keepAlive = false;
    let ctrl = new HttpController(req, res)

    if (res.statusCode === 404)
        err = new HttpError(404);
    else if (res.statusCode === 405)
        err = new HttpError(405);
    else if (err instanceof Error)
        err = new HttpError(500, err.message);
    else if (typeof err === "string")
        err = new HttpError(500, err);
    else
        err = new HttpError(500);

    handleError(err, ctrl, req.method + " " + req.url);
}

export function getRouteHandler(route: string): RouteHandler {
    return (req: Request, res: Response) => {
        let { Class, method } = RouteMap[route],
            ctrl: HttpController = null;

        res.on("error", (err) => {
            handleLog(err, ctrl, method);
        });

        // Handle the procedure in a Promise context.
        new Promise((resolve, reject) => {
            try {
                let handleNext = getNextHandler(method, resolve, reject);

                if (Class.length === 3) {
                    ctrl = new Class(req, res, handleNext);
                } else {
                    ctrl = new Class(req, res);
                    handleNext(ctrl);
                }
            } catch (err) {
                reject(err);
            }
        }).then((data: any) => {
            return handleResponse(ctrl, data);
        }).then(() => {
            return ctrl.after();
        }).then(result => {
            return result === false
                ? result
                : callIntercepterChain(Class.AfterIntercepters[method], ctrl);
        }).catch((err: Error) => {
            ctrl = ctrl || new HttpController(req, res);

            handleError(err, ctrl, method);
        });
    }
}

function getNextHandler(
    method: string,
    resolve: (value: any) => any,
    reject: (err: any) => void
) {
    return (ctrl: HttpController) => {
        let { req, res } = ctrl,
            { BeforeIntercepters, RequireAuth } = ctrl.Class;

        new Promise((_resolve, _reject) => {
            // Handle CORS.
            if (!cors(<any>ctrl.cors, req, res)) {
                return _reject(new HttpError(410));
            } else if (req.method === "OPTIONS") {
                // cors will set proper headers for OPTIONS
                res.end();
                return _resolve(false);
            }

            // Handle CSRF token.
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
                return callIntercepterChain(BeforeIntercepters[method], ctrl, true);
        }).then(result => {
            if (result === false || res.sent) {
                // if the response has been sent before calling the actual method,
                // resolve the Promise immediately without running any checking 
                // procedure, and don't call the method.
                return resolve(null);
            }

            // Handle authentication.
            if (RequireAuth.includes(method) && !ctrl.authorized) {
                if (ctrl.fallbackTo) {
                    return res.redirect(ctrl.fallbackTo, 302);
                } else {
                    throw new HttpError(401);
                }
            }

            // Handle GZip.
            res.gzip = req.encoding == "gzip" && ctrl.gzip;

            // Handle jsonp.
            if (req.method == "GET" && ctrl.jsonp
                && req.query[ctrl.jsonp]) {
                res.jsonp = req.query[ctrl.jsonp];
            }

            return getResult(ctrl, method);
        }).then(resolve).catch(reject);
    }
}

export function handleLog(err: Error, ctrl: Controller, method?: string) {
    if (config.server.error.log) {
        // Log the error to a file.
        let str = err.toString(),
            action: string;

        if (method && method.indexOf(" ") > 0) {
            action = method;
        } else {
            let i = err.stack.indexOf("\n") + 1,
                stack = (err.stack.slice(i, err.stack.indexOf("\n", i))).trim();

            if (method) stack = stack.replace("<anonymous>", method);

            action = stack.replace("_1", "").slice(3);
        }

        let logger = ctrl.logger,
            trace = logger.trace;

        logger.trace = false; // temporarily disable trace.
        logger.action = action; // temporarily set action.
        logger.error(str);
        logger.trace = trace;
        logger.action = undefined;
    }
}

function handleFinish(err: Error, ctrl: HttpController, method: string): void {
    handleLog(err, ctrl, method);
    finish(ctrl);

    if (isDevMode && !(err instanceof HttpError)) {
        callsiteLog(err);
    }
}

function handleError(err: Error, ctrl: HttpController, method?: string) {
    let { req, res } = ctrl;

    // If the response is has already been sent, handle finish immediately.
    if (res.sent)
        return handleFinish(err, ctrl, method);

    // If the response hasn't been sent, try to response the error in a proper 
    // form to the client.

    // Be friendly to EventSource.
    if (err instanceof HttpError && err.code == 405 && req.isEventSource)
        err = new HttpError(204);

    let _err: Error = err;

    if (!(err instanceof HttpError)) {
        if (err instanceof Error && config.server.error.show)
            err = new HttpError(500, err.message);
        else
            err = new HttpError(500);
    }

    if (req.accept == "application/json" || res.jsonp) {
        // Send JSON response.
        res.send(ctrl.error(err.message, (<HttpError>err).code));
        handleFinish(_err, ctrl, method);
    } else {
        res.status = (<HttpError>err).code;

        // Try to load the error page, if not present, then show the 
        // error message.
        ctrl.Class.httpErrorView(<HttpError>err, ctrl).then(content => {
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

async function getResult(ctrl: HttpController, method: string) {
    return callMethod(ctrl, ctrl[method], ...(await getArguments(ctrl, method)));
}

async function getArguments(ctrl: HttpController, method: string) {
    let { req, res } = ctrl,
        data: string[] = values(req.params),
        args: any[] = [],
        fnParams = getFuncParams(ctrl[method]),
        reqParams = ["request", "req"],
        resParams = ["response", "res"];

    // Dependency Injection
    if (isTypeScript) {
        // try to convert parameters to proper types according to 
        // the definition of the method.
        let meta: any[] = Reflect.getMetadata("design:paramtypes", ctrl, method);

        for (let i = 0; i < meta.length; i++) {
            if (meta[i] == Number) { // inject number
                args[i] = parseInt(data.shift());
            } else if (meta[i] == Boolean) { // inject boolean
                let val = data.shift();
                args[i] = val == "false" || val == "0" ? false : true;
            } else if (meta[i] == Object) {
                if (reqParams.includes(fnParams[i])) // Inject Request
                    args[i] = req;
                else if (resParams.includes(fnParams[i])) // Inject Response
                    args[i] = res;
                else
                    args[i] = data.shift();
            } else if (meta[i].prototype instanceof Model) { // inject user-defined Model
                if (req.method == "POST" && req.params.id === undefined) {
                    // POST request means creating a new model.
                    // If a POST request with an ID, which means the 
                    // request isn't a RESTful request, DO NOT 
                    // create new model.
                    args[i] = (new (<typeof Model>meta[i])).use(req.db);
                } else {
                    // Other type of requests, such as GET, DELETE, 
                    // PATCH, PUT, all need to retrieve an existing 
                    // model.
                    try {
                        let id = parseInt(req.params.id);

                        if (!id || isNaN(id))
                            throw new HttpError(400);

                        args[i] = await (<typeof Model>meta[i]).use(req.db).get(id);
                    } catch (e) {
                        args[i] = null;
                        throw e;
                    }
                }
            } else {
                args[i] = data.shift();
            }
        }
    } else {
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
}

function handleResponse(ctrl: HttpController, data: any) {
    let { req, res } = ctrl;

    if (!res.sent) {
        if (req.isEventSource) {
            if (data !== null && data !== undefined)
                ctrl.sse.send(data);
        } else if (req.method === "HEAD") {
            res.end();
        } else if (data !== undefined) {
            // Send data to the client.
            let xml = /(text|application)\/xml\b/;
            let type = <string>res.getHeader("Content-Type");

            if (data === null) {
                res.end("");
            } else if (typeof data === "object" && type && xml.test(type)) {
                res.xml(data);
            } else if (data instanceof Buffer) {
                res.send(data);
            } else if (typeof data === "string" && res.gzip) {
                return handleGzip(ctrl, data);
            } else {
                res.send(data);
            }
        }
    }

    return finish(ctrl);
}

function handleGzip(ctrl: HttpController, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
        let { res } = ctrl;
        zlib.gzip(data, (err, _data) => {
            if (err)
                return reject(err);

            res.headers["content-encoding"] = "gzip";
            res.type = "text/html";
            // Send compressed data.
            res.end(_data);
            resolve(null);
        });
    }).then(() => {
        return finish(ctrl);
    });
}

function finish(ctrl: HttpController): void {
    ctrl.emit("finish", ctrl.req, ctrl.res);
}

function handleCsrfToken(ctrl: HttpController): void {
    if (!ctrl.csrfProtection || !ctrl.req.session) return;

    let { req, res } = ctrl;

    if (req.method == "GET") {
        // Store CSRF tokens in session.
        if (!req.session.csrfTokens)
            req.session.csrfTokens = {};

        // Define a setter to access and initiate CSRF token.
        Object.defineProperty(req, "csrfToken", {
            set(v: string) {
                req[realCsrfToken] = v;
                req.session.csrfTokens[req.url] = v;
                // Set a response header to carry CSRF token.
                res.set("X-CSRF-Token", v);
            },
            get() {
                if (!req[realCsrfToken])
                    req.csrfToken = randStr(64);

                return req[realCsrfToken];
            }
        });
    } else if (EFFECT_METHODS.includes(req.method)) {
        if (!req.headers.referer) {
            // If no referer is sent, throw 403 error.
            throw new HttpError(403);
        }

        let ref: string = <string>req.headers.referer,
            tokens: object = req.session.csrfTokens,
            token: string = tokens && tokens[ref];

        if (token === undefined || (req.headers["x-csrf-token"] != token
            && req.query["x-csrf-token"] != token
            && req.body["x-csrf-token"] != token)) {
            // If no token or none is matched, throw 403 error.
            throw new HttpError(403);
        } else {
            // Make a reference to the token.
            Object.defineProperty(req, "csrfToken", {
                set(v: string) {
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