"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const zlib = require("zlib");
const multer = require("multer");
const cors = require("sfn-cors");
const date = require("sfn-date");
const values = require("lodash/values");
const ideal_filename_1 = require("ideal-filename");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
const HttpController_1 = require("../controllers/HttpController");
const HttpError_1 = require("../tools/HttpError");
const functions_1 = require("../tools/functions");
const functions_inner_1 = require("../tools/functions-inner");
const symbols_1 = require("../tools/symbols");
const RouteMap_1 = require("../tools/RouteMap");
const init_1 = require("../../init");
const EFFECT_METHODS = [
    "DELETE",
    "PATCH",
    "POST",
    "PUT"
];
function finish(ctrl) {
    ctrl.emit("finish", ctrl.req, ctrl.res);
}
function handleLog(ctrl, err) {
    if (ConfigLoader_1.config.server.error.log) {
        ctrl.logger.error(err.message);
    }
}
function handleFinish(ctrl, err) {
    handleLog(ctrl, err);
    finish(ctrl);
    if (ConfigLoader_1.isDevMode && !(err instanceof HttpError_1.HttpError)) {
        functions_inner_1.callsiteLog(err);
    }
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
function getDestination(savePath, reject) {
    return (req, file, cb) => {
        fs.ensureDir(savePath, err => {
            err ? reject(err) : cb(null, savePath);
        });
    };
}
function getFilename(ctrl, savePath, reject) {
    return (req, file, cb) => {
        try {
            if (ctrl.uploadOptions.filename instanceof Function) {
                let filename = ctrl.uploadOptions.filename(file);
                cb(null, filename);
            }
            else if (ctrl.uploadOptions.filename === "random") {
                let extname = path.extname(file.originalname), filename = functions_1.randStr(32) + extname;
                cb(null, filename);
            }
            else {
                let filename = `${savePath}/${file.originalname}`;
                ideal_filename_1.idealFilename(filename).then(filename => {
                    cb(null, path.basename(filename));
                }).catch(err => {
                    reject(err);
                });
            }
        }
        catch (err) {
            reject(err);
        }
    };
}
function getStorage(ctrl, reject) {
    let savePath = `${ctrl.uploadOptions.savePath}/` + date("Y-m-d");
    return multer.diskStorage({
        destination: getDestination(savePath, reject),
        filename: getFilename(ctrl, savePath, reject)
    });
}
function getUploader(ctrl, reject) {
    return multer({
        storage: getStorage(ctrl, reject),
        fileFilter: (req, file, cb) => {
            try {
                cb(null, ctrl.uploadOptions.filter(file));
            }
            catch (err) {
                reject(err);
            }
        }
    });
}
function handleUpload(ctrl, method, resolve, reject) {
    let { req, res } = ctrl, uploadFields = ctrl.Class.UploadFields[method], getResult = () => {
        let data = values(req.params), params = [], fnParams = functions_inner_1.getFuncParams(ctrl[method]), reqProps = ["request", "req"], resProps = ["response", "res"];
        if (init_1.isTypeScript) {
            let meta = Reflect.getMetadata("design:paramtypes", ctrl, method);
            for (let i in meta) {
                if (meta[i] == Number) {
                    params[i] = parseInt(data.shift());
                }
                else if (meta[i] == Boolean) {
                    let val = data.shift();
                    params[i] = val == "false" || val == "0" ? false : true;
                }
                else if (meta[i] == Object) {
                    if (reqProps.includes(fnParams[i]))
                        params[i] = req;
                    else if (resProps.includes(fnParams[i]))
                        params[i] = res;
                    else
                        params[i] = data.shift();
                }
                else {
                    params[i] = data.shift();
                }
            }
        }
        else {
            for (let i in fnParams) {
                if (reqProps.includes(fnParams[i]))
                    params[i] = req;
                else if (resProps.includes(fnParams[i]))
                    params[i] = res;
                else
                    params[i] = data.shift();
            }
        }
        return functions_inner_1.callMethod(ctrl, ctrl[method], ...params);
    };
    if (req.method == "POST" && uploadFields && uploadFields.length) {
        let fields = [];
        for (let field of uploadFields) {
            fields.push({
                name: field,
                maxCount: ctrl.uploadOptions.maxCount
            });
        }
        let uploader = getUploader(ctrl, reject);
        let handle = uploader.fields(fields);
        handle(req, res, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(getResult());
            }
        });
    }
    else {
        resolve(getResult());
    }
}
function handleError(err, ctrl) {
    let { req, res } = ctrl;
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
        handleFinish(ctrl, _err);
    }
    else {
        res.status = err.code;
        ctrl.Class.httpErrorView(err, ctrl).then(content => {
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
function getNextHandler(method, action, resolve, reject) {
    return (ctrl) => {
        ctrl.logOptions.action = action;
        let { req, res } = ctrl;
        Promise.resolve(ctrl.before()).then(() => {
            if (res.finished) {
                return resolve(null);
            }
            if (!cors(ctrl.cors, req, res)) {
                throw new HttpError_1.HttpError(410);
            }
            else if (req.method === "OPTIONS") {
                res.end();
                return;
            }
            if (ctrl.Class.RequireAuth.includes(method) && !ctrl.authorized) {
                if (ctrl.fallbackTo) {
                    return res.redirect(ctrl.fallbackTo, 302);
                }
                else {
                    throw new HttpError_1.HttpError(401);
                }
            }
            handleCsrfToken(ctrl);
            res.gzip = req.encoding == "gzip" && ctrl.gzip;
            if (req.method == "GET" && ctrl.jsonp
                && req.query[ctrl.jsonp]) {
                res.jsonp = req.query[ctrl.jsonp];
            }
            handleUpload(ctrl, method, resolve, reject);
        }).catch(err => {
            reject(err);
        });
    };
}
function handleGzip(res, data) {
    return new Promise((resolve, reject) => {
        zlib.gzip(data, (err, _data) => {
            if (err)
                return reject(err);
            res.headers["content-encoding"] = "gzip";
            res.type = "text/html";
            res.end(_data);
            resolve(_data);
        });
    });
}
function handleResponse(ctrl, data) {
    let { req, res } = ctrl;
    if (!res.finished) {
        if (req.isEventSource) {
            if (data !== null && data !== undefined)
                ctrl.sse.send(data);
        }
        else if (req.method === "HEAD") {
            return res.end();
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
                return handleGzip(res, data);
            }
            else {
                res.send(data);
            }
        }
    }
    return finish(ctrl);
}
function getRouteHandler(Class, method) {
    return (req, res) => {
        let ctrl = null;
        let className = Class.name === "default_1" ? "default" : Class.name;
        let action = `${className}.${method} (${Class.filename})`;
        res.on("error", (err) => {
            handleLog(ctrl, err);
        });
        new Promise((resolve, reject) => {
            try {
                let handleNext = getNextHandler(method, action, resolve, reject);
                if (Class.prototype.constructor.length === 3) {
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
        }).catch((err) => {
            ctrl = ctrl || new HttpController_1.HttpController(req, res);
            ctrl.logOptions.action = action;
            handleError(err, ctrl);
        });
    };
}
function handleHttpRoute(app) {
    for (let route in RouteMap_1.RouteMap) {
        let Class = RouteMap_1.RouteMap[route].Class, _route = route.split(/\s+/), method = _route[0] === "SSE" ? "GET" : _route[0], path = (Class.baseURI || "") + _route[1];
        app.method(method, path, getRouteHandler(Class, RouteMap_1.RouteMap[route].method));
    }
    app.onerror = function onerror(err, req, res) {
        res.keepAlive = false;
        let ctrl = new HttpController_1.HttpController(req, res);
        ctrl.logOptions.action = req.method + " " + req.url;
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
        handleError(err, ctrl);
    };
}
exports.handleHttpRoute = handleHttpRoute;
//# sourceMappingURL=HttpRouteHandler.js.map