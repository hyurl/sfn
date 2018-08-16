import * as path from "path";
import * as fs from "fs-extra";
import * as zlib from "zlib";
import * as multer from "multer";
import * as cors from "sfn-cors";
import * as date from "sfn-date";
import { Model } from 'modelar';
import values = require("lodash/values");
import { idealFilename } from "ideal-filename";
import { App } from "webium";
import { config, isDevMode } from "../bootstrap/ConfigLoader";
import { HttpController, UploadingFile } from "../controllers/HttpController";
import { HttpError } from "../tools/HttpError";
import { randStr } from "../tools/functions";
import { callsiteLog, callMethod, getFuncParams } from "../tools/functions-inner";
import { Request, Response, HttpRequestMethod } from "../tools/interfaces";
import { realCsrfToken } from "../tools/symbols";
import { RouteMap } from "../tools/RouteMap";
import { isTypeScript } from '../../init';

const EFFECT_METHODS: HttpRequestMethod[] = [
    "DELETE",
    "PATCH",
    "POST",
    "PUT"
];

function finish(ctrl: HttpController): void {
    ctrl.emit("finish", ctrl.req, ctrl.res);
}

function handleLog(ctrl: HttpController, err: Error) {
    if (config.server.error.log) {
        // Log the error to a file.
        ctrl.logger.error(err.message);
    }
}

function handleFinish(ctrl: HttpController, err: Error): void {
    handleLog(ctrl, err);
    finish(ctrl);

    if (isDevMode && !(err instanceof HttpError)) {
        callsiteLog(err);
    }
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

function getDestination(savePath: string, reject: Function) {
    return (req, file: UploadingFile, cb) => {
        fs.ensureDir(savePath, err => {
            err ? reject(err) : cb(null, savePath);
        });
    }
}

function getFilename(ctrl: HttpController, savePath: string, reject: Function) {
    return (req, file: UploadingFile, cb: Function) => {
        try {
            if (ctrl.uploadOptions.filename instanceof Function) {
                // The filename is customized by the user.
                let filename = ctrl.uploadOptions.filename(file);
                cb(null, filename);
            } else if (ctrl.uploadOptions.filename === "random") {
                // The filename will be a random string.
                let extname = path.extname(file.originalname),
                    filename = randStr(32) + extname;
                cb(null, filename);
            } else {
                // auto-increment
                let filename = `${savePath}/${file.originalname}`;
                idealFilename(filename).then(filename => {
                    cb(null, path.basename(filename));
                }).catch(err => {
                    reject(err);
                });
            }
        } catch (err) {
            reject(err);
        }
    }
}

function getStorage(ctrl: HttpController, reject: Function) {
    let savePath = `${ctrl.uploadOptions.savePath}/` + date("Y-m-d");
    return multer.diskStorage({
        destination: getDestination(savePath, reject),
        filename: getFilename(ctrl, savePath, reject)
    });
}

function getUploader(ctrl: HttpController, reject: Function) {
    return multer({
        storage: getStorage(ctrl, reject),
        fileFilter: (req, file: UploadingFile, cb) => {
            try {
                cb(null, ctrl.uploadOptions.filter(file));
            } catch (err) {
                reject(err);
            }
        }
    });
}

function handleUpload(
    ctrl: HttpController,
    method: string,
    resolve: Function,
    reject: Function
) {
    let { req, res } = ctrl,
        uploadFields = ctrl.Class.UploadFields[method],
        getResult = async () => {
            let data: string[] = values(req.params),
                params: any[] = [],
                fnParams = getFuncParams(ctrl[method]),
                reqProps = ["request", "req"],
                resProps = ["response", "res"];

            // Dependency Injection
            if (isTypeScript) {
                // try to convert parameters to proper types according to 
                // the definition of the method.
                let meta: Function[] = Reflect.getMetadata("design:paramtypes", ctrl, method);

                for (let i in meta) {
                    if (meta[i] == Number) { // inject number
                        params[i] = parseInt(data.shift());
                    } else if (meta[i] == Boolean) { // inject boolean
                        let val = data.shift();
                        params[i] = val == "false" || val == "0" ? false : true;
                    } else if (meta[i] == Object) {
                        if (reqProps.includes(fnParams[i])) // Inject Request
                            params[i] = req;
                        else if (resProps.includes(fnParams[i])) // Inject Response
                            params[i] = res;
                        else
                            params[i] = data.shift();
                    } else if (meta[i].prototype instanceof Model) { // inject user-defined Model
                        if (req.method == "POST" && req.params.id === undefined) {
                            // POST request means creating a new model.
                            // If a POST request with an ID, which means the 
                            // request isn't a RESTful request, DO NOT 
                            // create new model.
                            params[i] = (new (<typeof Model>meta[i])).use(req.db);
                        } else {
                            // Other type of requests, such as GET, DELETE, 
                            // PATCH, PUT, all need to retrieve an existing 
                            // model.
                            try {
                                let id = parseInt(req.params.id);

                                if (!id || isNaN(id))
                                    throw new HttpError(400);

                                params[i] = await (<typeof Model>meta[i]).use(req.db).get(id);
                            } catch (e) {
                                params[i] = null;
                                throw e;
                            }
                        }
                    } else {
                        params[i] = data.shift();
                    }
                }
            } else {
                for (let i in fnParams) {
                    if (reqProps.includes(fnParams[i]))
                        params[i] = req;
                    else if (resProps.includes(fnParams[i]))
                        params[i] = res;
                    else
                        params[i] = data.shift();
                }
            }

            return await callMethod(ctrl, ctrl[method], ...params);
        };

    if (req.method == "POST" && uploadFields && uploadFields.length) {
        // Configure fields.
        let fields: Array<{ name: string, maxCount: number }> = [];
        for (let field of uploadFields) {
            fields.push({
                name: field,
                maxCount: ctrl.uploadOptions.maxCount
            });
        }

        let uploader = getUploader(ctrl, reject);
        let handle = uploader.fields(fields);

        handle(<any>req, <any>res, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(getResult());
            }
        });
    } else {
        resolve(getResult());
    }
}

function handleError(err: Error, ctrl: HttpController) {
    let { req, res } = ctrl;

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
        res.send(ctrl.error(err.message, (<HttpError>err).code));
        handleFinish(ctrl, _err);
    } else {
        res.status = (<HttpError>err).code;

        // Try to load the error page, if not present, then show the 
        // error message.
        ctrl.Class.httpErrorView(<HttpError>err, ctrl).then(content => {
            res.type = "text/html";
            res.send(content);
            handleFinish(ctrl, _err);
        }).catch(() => {
            res.type = "text/plain";
            res.send(err.message);
            handleFinish(ctrl, _err);
        });
    }
}

function getNextHandler(
    method: string,
    action: string,
    resolve: Function,
    reject: Function
) {
    return (ctrl: HttpController) => {
        ctrl.logOptions.action = action;

        let { req, res } = ctrl;

        Promise.resolve(ctrl.before()).then(() => {
            if (res.finished) {
                // if the response has been sent before calling the actual method,
                // resolve the Promise immediately without running any checking 
                // procedure, and don't call the method.
                return resolve(null);
            }

            // Handle CORS.
            if (!cors(<any>ctrl.cors, req, res)) {
                throw new HttpError(410);
            } else if (req.method === "OPTIONS") {
                // cors will set proper headers for OPTIONS
                res.end();
                return;
            }

            // Handle authentication.
            if (ctrl.Class.RequireAuth.includes(method) && !ctrl.authorized) {
                if (ctrl.fallbackTo) {
                    return res.redirect(ctrl.fallbackTo, 302);
                } else {
                    throw new HttpError(401);
                }
            }

            // Handle CSRF token.
            handleCsrfToken(ctrl);

            // Handle GZip.
            res.gzip = req.encoding == "gzip" && ctrl.gzip;

            // Handle jsonp.
            if (req.method == "GET" && ctrl.jsonp
                && req.query[ctrl.jsonp]) {
                res.jsonp = req.query[ctrl.jsonp];
            }

            // Handle file uploading.
            handleUpload(ctrl, method, resolve, reject);
        }).catch(err => {
            reject(err);
        });
    }
}

function handleGzip(res: Response, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
        zlib.gzip(data, (err, _data) => {
            if (err)
                return reject(err);

            res.headers["content-encoding"] = "gzip";
            res.type = "text/html";
            // Send compressed data.
            res.end(_data);
            resolve(_data);
        });
    });
}

function handleResponse(ctrl: HttpController, data: any) {
    let { req, res } = ctrl;

    if (!res.finished) {
        if (req.isEventSource) {
            if (data !== null && data !== undefined)
                ctrl.sse.send(data);
        } else if (req.method === "HEAD") {
            return res.end();
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
                return handleGzip(res, data);
            } else {
                res.send(data);
            }
        }
    }

    return finish(ctrl);
}

function getRouteHandler(Class: typeof HttpController, method: string) {
    return (req: Request, res: Response) => {
        let ctrl: HttpController = null;
        let className = Class.name === "default_1" ? "default" : Class.name;
        let action = `${className}.${method} (${Class.filename})`;

        res.on("error", (err) => {
            handleLog(ctrl, err);
        });

        // Handle the procedure in a Promise context.
        new Promise((resolve, reject) => {
            try {
                let handleNext = getNextHandler(method, action, resolve, reject);

                if (Class.prototype.constructor.length === 3) {
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
        }).catch((err: Error) => {
            ctrl = ctrl || new HttpController(req, res);
            ctrl.logOptions.action = action;

            handleError(err, ctrl);
        });
    }
}

export function handleHttpRoute(app: App): void {
    for (let route in RouteMap) {
        let Class = RouteMap[route].Class,
            _route = route.split(/\s+/),
            method = _route[0] === "SSE" ? "GET" : _route[0],
            path = (Class.baseURI || "") + _route[1];

        app.method(method, path, getRouteHandler(Class, RouteMap[route].method));
    }

    app.onerror = function onerror(err: any, req: Request, res: Response) {
        res.keepAlive = false;
        let ctrl = new HttpController(req, res)
        ctrl.logOptions.action = req.method + " " + req.url;

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

        handleError(err, ctrl);
    }
}