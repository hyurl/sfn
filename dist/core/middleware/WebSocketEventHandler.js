"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date = require("sfn-date");
const chalk_1 = require("chalk");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
const SocketError_1 = require("../tools/SocketError");
const functions_inner_1 = require("../tools/functions-inner");
const symbols_1 = require("../tools/symbols");
const WebSocketController_1 = require("../controllers/WebSocketController");
const EventMap_1 = require("../tools/EventMap");
const init_1 = require("../../init");
function finish(ctrl, info) {
    let socket = ctrl.socket;
    if (socket[symbols_1.realDB])
        socket[symbols_1.realDB].release();
    ctrl.emit("finish", socket);
    if (ConfigLoader_1.isDevMode) {
        let cost = Date.now() - info.time, dateTime = chalk_1.default.cyan(`[${date("Y-m-d H:i:s.ms")}]`), type = chalk_1.default.bold(socket.protocol.toUpperCase()), code = info.code, codeStr = code.toString();
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
        }
        console.log(`${dateTime} ${type} ${info.event} ${codeStr} ${cost}`);
    }
}
function handleError(err, ctrl, info) {
    let _err = err;
    if (!(err instanceof SocketError_1.SocketError)) {
        if (err instanceof Error && ConfigLoader_1.config.server.error.show)
            err = new SocketError_1.SocketError(500, err.message);
        else
            err = new SocketError_1.SocketError(500);
    }
    info.code = err.code;
    if (info.event) {
        ctrl.socket.emit(info.event, ctrl.error(err.message, info.code));
    }
    else {
        ctrl.logOptions.action = info.event = "unknown";
    }
    if (ConfigLoader_1.config.server.error.log) {
        ctrl.logger.error(_err.message);
    }
    finish(ctrl, info);
    if (ConfigLoader_1.isDevMode && !(_err instanceof SocketError_1.SocketError)) {
        functions_inner_1.callsiteLog(_err);
    }
}
function getNextHandler(method, action, data, resolve, reject) {
    return (ctrl) => {
        ctrl.logOptions.action = action;
        let { BeforeFilters, RequireAuth } = ctrl.Class;
        Promise.resolve(ctrl.before()).then(result => {
            if (result === false || ctrl.socket.disconnected)
                return result;
            else
                return functions_inner_1.callFilterChain(BeforeFilters[method], ctrl, true);
        }).then(result => {
            if (result === false || ctrl.socket.disconnected) {
                return resolve(null);
            }
            if (RequireAuth.includes(method) && !ctrl.authorized)
                throw new SocketError_1.SocketError(401);
            let params = [], fnParams = functions_inner_1.getFuncParams(ctrl[method]), socketProps = ["websocket", "socket", "sock", "webSocket"];
            if (init_1.isTypeScript) {
                let meta = Reflect.getMetadata("design:paramtypes", ctrl, method);
                for (let i in meta) {
                    if (meta[i] == Object && socketProps.includes(fnParams[i]))
                        params[i] = ctrl.socket;
                    else
                        params[i] = data.shift();
                }
            }
            else {
                for (let i in fnParams) {
                    if (socketProps.includes(fnParams[i]))
                        params[i] = ctrl.socket;
                    else
                        params[i] = data.shift();
                }
            }
            resolve(functions_inner_1.callMethod(ctrl, ctrl[method], ...params));
        }).catch(err => {
            reject(err);
        });
    };
}
function handleEvent(socket, event, ...data) {
    let { Class, method } = EventMap_1.EventMap[event], className = Class.name === "default_1" ? "default" : Class.name, action = `${className}.${method} (${Class.filename})`, ctrl = null, info = {
        time: Date.now(),
        event,
        code: 200
    };
    new Promise((resolve, reject) => {
        try {
            let handleNext = getNextHandler(method, action, data, resolve, reject);
            if (Class.length === 2) {
                ctrl = new Class(socket, handleNext);
            }
            else {
                ctrl = new Class(socket);
                handleNext(ctrl);
            }
        }
        catch (err) {
            reject(err);
        }
    }).then((_data) => {
        if (_data !== undefined) {
            socket.emit(event, _data);
        }
        finish(ctrl, info);
    }).then(() => {
        return ctrl.after();
    }).then(result => {
        return result === false || ctrl.socket.disconnect
            ? result
            : functions_inner_1.callFilterChain(Class.AfterFilters[method], ctrl);
    }).catch((err) => {
        ctrl = ctrl || new WebSocketController_1.WebSocketController(socket);
        ctrl.logOptions.action = action;
        handleError(err, ctrl, info);
    });
}
function handleWebSocketEvent(io) {
    io.on("connection", (socket) => {
        for (let event in EventMap_1.EventMap) {
            socket.on(event, (...data) => {
                handleEvent(socket, event, ...data);
            });
        }
        socket.on("error", (err) => {
            let ctrl = new WebSocketController_1.WebSocketController(socket);
            handleError(err, ctrl, {
                time: Date.now(),
                event: "",
                code: 500
            });
        });
    });
}
exports.handleWebSocketEvent = handleWebSocketEvent;
//# sourceMappingURL=WebSocketEventHandler.js.map