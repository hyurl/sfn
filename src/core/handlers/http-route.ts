import * as zlib from "zlib";
import * as cors from "sfn-cors";
import values = require("lodash/values");
import { RouteHandler } from "webium";
import { router } from "../bootstrap/index";
import { HttpController } from "../controllers/HttpController";
import { HttpException } from "../tools/HttpException";
import { EFFECT_METHODS } from "../tools/functions";
import isOwnMethod from "@hyurl/utils/isOwnMethod";
import { tryLogError } from "../tools/internal/error";
import { Request, Response, Session } from "../tools/interfaces";
import { realCsrfToken } from "../tools/symbols";
import { routeMap } from '../tools/RouteMap';
import { number } from 'literal-toolkit';
import { isIterableIterator, isAsyncIterableIterator } from "check-iterable";
import { Controller } from '../controllers/Controller';
import randStr from "@hyurl/utils/randStr";

const XMLType = /(text|application)\/xml\b/;

router.onerror = function onerror(err: any, req: Request, res: Response) {
    res.keepAlive = false;
    let ctrl = new HttpController(req, res)

    if (res.statusCode === 404)
        err = new HttpException(404);
    else if (res.statusCode === 405)
        err = new HttpException(405);
    else if (err instanceof Error)
        err = new HttpException(500, err.message);
    else if (typeof err === "string")
        err = new HttpException(500, err);
    else
        err = new HttpException(500);

    handleError(err, ctrl, req.method + " " + req.shortUrl);
}

export function getRouteHandler(key: string): RouteHandler {
    return async (req: Request, res: Response) => {
        let Controller = routeMap.resolve(key);
        let methods = routeMap.methods(key);
        let ctrl: HttpController = null;
        let initiated = false;

        res.on("error", (err) => {
            tryLogError(err, req.method + " " + req.shortUrl);
        });

        try {
            ctrl = new Controller(req, res);

            for (let method of methods) {
                if (!isOwnMethod(ctrl, method)) {
                    routeMap.del(key, method);
                    continue;
                } else if (!initiated) {
                    // Handle CORS.
                    if (ctrl.ctor["cors"] && !cors(ctrl.ctor["cors"], req, res)) {
                        throw new HttpException(410);
                    }

                    // Handle CSRF token.
                    handleCsrfToken(ctrl);

                    await applyInit(ctrl);

                    initiated = true;

                    // Handle GZip.
                    res.gzip = req.encodings.includes("gzip") && ctrl.gzip;

                    // Handle jsonp.
                    if (req.method == "GET" && ctrl.jsonp && req.query[ctrl.jsonp]) {
                        res.jsonp = req.query[ctrl.jsonp];
                    }
                }

                let result = await ctrl[method](...getArguments(ctrl, method));

                if (isIterableIterator(result) || isAsyncIterableIterator(result)) {
                    await handleIteratorResponse(ctrl, result);
                } else {
                    await handleResponse(ctrl, result);
                }
            }

            if (initiated) {
                if (!req.isEventSource && !res.sent) {
                    res.end();
                }

                await applyDestroy(ctrl);

                finish(ctrl);
            }
        } catch (err) {
            ctrl = ctrl || new HttpController(req, res);

            handleError(err, ctrl);
        }
    }
}

export async function applyInit(ctrl: Controller) {
    if (typeof ctrl.init === "function") {
        await ctrl.init();
    } else if (typeof ctrl.before === "function") {
        await ctrl.before();
    }
}

export async function applyDestroy(ctrl: Controller) {
    if (typeof ctrl.destroy === "function") {
        await ctrl.destroy();
    } else if (typeof ctrl.after === "function") {
        await ctrl.after();
    }
}

function handleFinish(err: Error, ctrl: HttpController, stack: string) {
    tryLogError(err, stack);
    finish(ctrl);
}

async function handleError(err: any, ctrl: HttpController, stack?: string) {
    let { req, res } = ctrl;

    // If the response is has already been sent, handle finish immediately.
    if (res.sent)
        return handleFinish(err, ctrl, stack);

    // If the response hasn't been sent, try to response the error in a proper 
    // form to the client.

    let _err: HttpException;

    if (err instanceof HttpException && err.code === 405 && req.isEventSource)
        _err = new HttpException(204); // Be friendly to EventSource.
    else
        _err = HttpException.from(err);

    if (req.accept == "application/json" || res.jsonp) {
        // Send JSON response.
        res.send(ctrl.fail(_err.message, _err.code));
    } else {
        res.status = _err.code;

        // Try to load the error page, if not present, then show the 
        // error message.
        try {
            let { httpErrorView } = <typeof HttpController>ctrl.ctor;
            let content = await httpErrorView(_err, ctrl);

            res.type = "text/html";
            res.send(content);
        } catch (e) {
            res.type = "text/plain";
            res.send(_err.message);
        }
    }

    handleFinish(err, ctrl, stack);
}

function getArguments(ctrl: HttpController, method: string) {
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
    iter: IterableIterator<any> | AsyncIterableIterator<any>
) {
    let { req, res, sse } = ctrl;
    let reqType = req.type;
    let value: any, done: boolean;

    while ({ value, done } = await iter.next()) {
        if (value === undefined) {
            if (done)
                break;
            else
                continue;
        } else if (!res.headersSent && !req.isEventSource) {
            if (!res.type && reqType && reqType !== "*/*") {
                res.type = reqType;
            } else if (Buffer.isBuffer(value)) {
                res.type = "application/octet-stream";
            } else if (typeof value === "string") {
                res.type = "text/plain";
            }

            res.writeHead(200);
        }

        if (req.isEventSource) {
            sse.send(value);
        } else if (Buffer.isBuffer(value)) {
            res.write(value);
        } else {
            res.write(String(value));
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
                return !req[realCsrfToken] || (req.csrfToken = randStr(64));
            }
        });
    } else if (EFFECT_METHODS.includes(req.method)) {
        if (!req.headers.referer) {
            // If no referrer is sent, throw 403 error.
            throw new HttpException(403);
        }

        let ref: string = <string>req.headers.referer,
            tokens: object = req.session.csrfTokens,
            token: string = tokens && tokens[ref];

        if (token === undefined || (req.headers["x-csrf-token"] != token
            && req.query["x-csrf-token"] != token
            && req.body["x-csrf-token"] != token)) {
            // If no token or none is matched, throw 403 error.
            throw new HttpException(403);
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
