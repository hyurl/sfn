"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_1 = require("../../../init");
const ConfigLoader_1 = require("../../bootstrap/ConfigLoader");
const index_1 = require("../../bootstrap/index");
const SocketError_1 = require("../../tools/SocketError");
const functions_inner_1 = require("../../tools/functions-inner");
const symbols_1 = require("../../tools/symbols");
const WebSocketController_1 = require("../../controllers/WebSocketController");
const EventMap_1 = require("../../tools/EventMap");
const http_route_1 = require("./http-route");
const http_init_1 = require("./http-init");
index_1.ws ? index_1.ws.on("connection", handler) : null;
index_1.wss ? index_1.wss.on("connection", handler) : null;
function handler(socket) {
    for (let event in EventMap_1.EventMap) {
        socket.on(event, (...data) => {
            handleEvent(socket, event, ...data);
        });
    }
    socket.on("error", (err) => {
        let ctrl = new WebSocketController_1.WebSocketController(socket);
        handleError(err, {
            time: Date.now(),
            event: "",
            code: 500
        }, ctrl, socket.protocol.toUpperCase());
    });
}
function finish(ctrl, info) {
    let socket = ctrl.socket;
    if (socket[symbols_1.realDB])
        socket[symbols_1.realDB].release();
    ctrl.emit("finish", socket);
    http_init_1.logRequest(info.time, socket.protocol.toUpperCase(), info.code, info.event);
}
function handleError(err, info, ctrl, method) {
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
    http_route_1.handleLog(_err, ctrl, method);
    finish(ctrl, info);
    if (ConfigLoader_1.isDevMode && !(_err instanceof SocketError_1.SocketError)) {
        functions_inner_1.callsiteLog(_err);
    }
}
function getNextHandler(method, data, resolve, reject) {
    return (ctrl) => {
        let { BeforeIntercepters, RequireAuth } = ctrl.Class;
        Promise.resolve(ctrl.before()).then(result => {
            if (result === false || ctrl.socket.disconnected)
                return result;
            else
                return functions_inner_1.callIntercepterChain(BeforeIntercepters[method], ctrl, true);
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
    let { Class, method } = EventMap_1.EventMap[event], ctrl = null, info = {
        time: Date.now(),
        event,
        code: 200
    };
    new Promise((resolve, reject) => {
        try {
            let handleNext = getNextHandler(method, data, resolve, reject);
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
            : functions_inner_1.callIntercepterChain(Class.AfterIntercepters[method], ctrl);
    }).catch((err) => {
        ctrl = ctrl || new WebSocketController_1.WebSocketController(socket);
        handleError(err, info, ctrl, method);
    });
}
//# sourceMappingURL=websocket-event.js.map