import * as zlib from "zlib";
import * as cors from "sfn-cors";
import values = require("lodash/values");
import { Model } from 'modelar';
import { RouteHandler } from "webium";
import { router } from "../bootstrap/index";
import { Controller } from "../controllers/Controller";
import { HttpController } from "../controllers/HttpController";
import { HttpError } from "../tools/HttpError";
import { randStr } from "../tools/functions";
import { callsiteLog, isOwnMethod } from "../tools/functions-inner";
import { Request, Response, Session } from "../tools/interfaces";
import { realCsrfToken } from "../tools/symbols";
import { isDevMode } from '../../init';
import { routeMap } from '../tools/RouteMap';
import { number } from 'literal-toolkit';
import isIteratorLike = require("is-iterator-like");

const EFFECT_METHODS: string[] = [
    "DELETE",
    "PATCH",
    "POST",
    "PUT"
];
const XMLType = /(text|application)\/xml\b/;

router.onerror = function onerror(err: any, req: Request, res: Response) {
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

export function getRouteHandler(key: string): RouteHandler {
    return async (req: Request, res: Response) => {
        let mod = routeMap.resolve(key),
            methods = routeMap.methods(key),
            ctrl: HttpController = null,
            initiated = false;

        res.on("error", (err) => {
            handleLog(err, ctrl);
        });

        try {
            ctrl = mod.create(req, res);

            for (let method of methods) {
                if (!isOwnMethod(ctrl, method)) {
                    routeMap.del(key, method);
                    continue;
                } else if (!initiated) {
                    // Handle CORS.
                    if (!cors(<any>ctrl.cors, req, res)) {
                        throw new HttpError(410);
                    } else if (req.method === "OPTIONS") {
                        // cors will set proper headers for OPTIONS
                        res.end();
                    }

                    // Handle CSRF token.
                    handleCsrfToken(ctrl);

                    if (false === (await ctrl.before())) return;

                    initiated = true;

                    // Handle GZip.
                    res.gzip = req.encoding == "gzip" && ctrl.gzip;

                    // Handle jsonp.
                    if (req.method == "GET" && ctrl.jsonp && req.query[ctrl.jsonp]) {
                        res.jsonp = req.query[ctrl.jsonp];
                    }
                }

                let result = await ctrl[method](...await getArguments(ctrl, method));

                if (isIteratorLike(result)) {
                    await handleIteratorResponse(ctrl, result);
                } else {
                    await handleResponse(ctrl, result);
                }
            }

            if (initiated) {
                if (!req.isEventSource) {
                    res.end();
                }

                await ctrl.after();
                finish(ctrl);
            }
        } catch (err) {
            ctrl = ctrl || new HttpController(req, res);

            handleError(err, ctrl);
        }
    }
}

export function handleLog(err: Error, ctrl: Controller, method?: string) {
    // Do not log http errors except they are server-side errors. 
    if (err instanceof HttpError && err.code < 500) return;

    if (isDevMode) {
        callsiteLog(err);
    } else {
        // Log the error to a file.
        let msg = err.toString(),
            stack: string;

        if (method && method.indexOf(" ") > 0) {
            stack = method;
        } else {
            let i = err.stack.indexOf("\n") + 1;

            stack = (err.stack.slice(i, err.stack.indexOf("\n", i))).trim();
            method && (stack = stack.replace("<anonymous>", method));
            stack = stack.replace("_1", "").slice(3);
        }

        ctrl.logger.hackTrace(stack);
        ctrl.logger.error(msg);
    }
}

function handleFinish(err: Error, ctrl: HttpController, method: string) {
    handleLog(err, ctrl, method);
    finish(ctrl);
}

async function handleError(err: any, ctrl: HttpController, method?: string) {
    let { req, res } = ctrl;

    // If the response is has already been sent, handle finish immediately.
    if (res.sent)
        return handleFinish(err, ctrl, method);

    // If the response hasn't been sent, try to response the error in a proper 
    // form to the client.

    let _err: HttpError;

    if (err instanceof HttpError) {
        // Be friendly to EventSource.
        _err = err.code == 405 && req.isEventSource ? new HttpError(204) : err;
    } else if (err instanceof Error) {
        _err = new HttpError(500, isDevMode ? err.message : null);
    } else {
        _err = new HttpError(500, String(err));
    }

    if (req.accept == "application/json" || res.jsonp) {
        // Send JSON response.
        res.send(ctrl.error(_err.message, _err.code));
    } else {
        res.status = _err.code;

        // Try to load the error page, if not present, then show the 
        // error message.
        try {
            let { httpErrorView } = <typeof HttpController>ctrl.ctor;
            let content = await httpErrorView(_err, ctrl);

            res.type = "text/html";
            res.send(content);
        } catch (err) {
            res.type = "text/plain";
            res.send(err.message);
        }
    }

    handleFinish(err, ctrl, method);
}

async function getArguments(ctrl: HttpController, method: string) {
    let { req, res } = ctrl,
        data: string[] = values(req.params),
        args: any[] = [];

    // Dependency Injection
    // Try to convert parameters to proper types according to the definition of 
    // the method.
    let meta: any[] = Reflect.getMetadata("design:paramtypes", ctrl, method);

    for (let type of meta) {
        if (type === Number) { // inject number
            args.push(number.parse(data.shift()));
        } else if (type === Boolean) { // inject boolean
            let val = data.shift();
            args.push(val == "false" || val == "0" ? false : true);
        } else if (type === Request) { // inject Request
            args.push(req);
        } else if (type === Response) { // inject Response
            args.push(res);
        } else if (type === Session) { // inject Session
            args.push(req.session);
        } else if (type.prototype instanceof Model) { // inject user-defined Model
            if (req.method == "POST" && req.params.id === undefined) {
                // POST request means creating a new model.
                // If a POST request with an ID, which means the 
                // request isn't a RESTful request, DO NOT 
                // create new model.
                args.push((new (<typeof Model>type)).use(req.db));
            } else {
                // Other type of requests, such as GET, DELETE, 
                // PATCH, PUT, all need to retrieve an existing 
                // model.
                try {
                    let id = <number>number.parse(req.params.id);

                    if (!id || isNaN(id))
                        throw new HttpError(400);

                    args.push(await (<typeof Model>type).use(req.db).get(id));
                } catch (e) {
                    args.push(null);
                }
            }
        } else {
            args.push(data.shift());
        }
    }

    return args;
}

async function handleResponse(ctrl: HttpController, data: any) {
    let { req, res } = ctrl;

    if (req.isEventSource) {
        if (data !== undefined)
            ctrl.sse.send(data);
    } else if (!res.sent) {
        if (req.method === "HEAD") {
            res.end();
        } else if (data !== undefined) {
            // Send data to the client.
            let type = res.type;

            if (data === null) {
                res.end("");
            } else if (typeof data === "object" && type && XMLType.test(type)) {
                res.xml(data);
            } else if (typeof data === "string" && res.gzip) {
                await handleGzip(ctrl, data);
            } else {
                res.send(data);
            }
        }
    }
}

async function handleIteratorResponse(
    ctrl: HttpController,
    iter: Iterable<any> | AsyncIterable<any>
) {
    let { req, res, sse } = ctrl;

    if (!res.headersSent && !req.isEventSource) {
        if (!res.type) {
            res.type = req.accept;
        }

        res.writeHead(200);
    }

    for await (let data of iter) {
        if (data !== undefined) {
            if (req.isEventSource) {
                sse.send(data);
            } else {
                res.write(data);
            }
        }
    }
}

async function handleGzip(ctrl: HttpController, data: any): Promise<any> {
    let { res } = ctrl;
    data = await new Promise((resolve, reject) => {
        zlib.gzip(data, (err, data) => err ? reject(err) : resolve(data));
    });

    res.headers["content-encoding"] = "gzip";
    res.type = "text/html";
    res.end(data);
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