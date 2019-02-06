"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../bootstrap/index");
const SocketError_1 = require("../tools/SocketError");
const symbols_1 = require("../tools/symbols");
const WebSocketController_1 = require("../controllers/WebSocketController");
const EventMap_1 = require("../tools/EventMap");
const http_route_1 = require("./http-route");
const http_init_1 = require("./http-init");
const websocket_init_1 = require("./websocket-init");
const websocket_cookie_1 = require("./websocket-cookie");
const websocket_session_1 = require("./websocket-session");
const websocket_db_1 = require("./websocket-db");
const websocket_auth_1 = require("./websocket-auth");
const functions_inner_1 = require("../tools/functions-inner");
const last = require("lodash/last");
const init_1 = require("../../init");
let importedNamesapces = [];
function tryImport(nsp) {
    if (!importedNamesapces.includes(nsp))
        return;
    importedNamesapces.push(nsp);
    index_1.ws.of(nsp)
        .use(websocket_init_1.default)
        .use(websocket_cookie_1.default)
        .use(websocket_cookie_1.handler2)
        .use(websocket_session_1.default)
        .use(websocket_session_1.handler2)
        .use(websocket_db_1.default)
        .use(websocket_auth_1.default)
        .on("connection", (socket) => {
        for (let event in EventMap_1.EventMap[nsp]) {
            socket.removeAllListeners(event);
            socket.on(event, (...data) => {
                handleEvent(socket, nsp, event, data);
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
    });
}
exports.tryImport = tryImport;
async function handleEvent(socket, nsp, event, data) {
    let { Class, method } = EventMap_1.EventMap[nsp][event], ctrl = null, info = {
        time: Date.now(),
        event,
        code: 200
    };
    try {
        socket[symbols_1.activeEvent] = nsp + (last(nsp) == "/" ? "" : "/") + event;
        ctrl = new Class(socket);
        ctrl.event;
        if (socket.disconnected || false === (await ctrl.before()))
            return;
        let _data = await ctrl[method](...getArguments(ctrl, method, data));
        _data === undefined || socket.emit(event, _data);
        finish(ctrl, info);
        await ctrl.after();
    }
    catch (err) {
        ctrl = ctrl || new WebSocketController_1.WebSocketController(socket);
        await handleError(err, info, ctrl, method);
    }
}
function getArguments(ctrl, method, data) {
    let args = [], fnParams = functions_inner_1.getFuncParams(ctrl[method]), socketParams = ["websocket", "socket", "sock", "webSocket"];
    let meta = Reflect.getMetadata("design:paramtypes", ctrl, method);
    for (let i = 0; i < meta.length; i++) {
        if (meta[i] == Object && socketParams.includes(fnParams[i]))
            args[i] = ctrl.socket;
        else
            args[i] = data.shift();
    }
    return args;
}
function finish(ctrl, info) {
    let socket = ctrl.socket;
    if (socket[symbols_1.realDB])
        socket[symbols_1.realDB].release();
    ctrl.emit("finish", socket);
    http_init_1.logRequest(info.time, socket.protocol.toUpperCase(), info.code, info.event);
}
async function handleError(err, info, ctrl, method) {
    let _err;
    if (err instanceof SocketError_1.SocketError) {
        _err = err;
    }
    else if (err instanceof Error && init_1.isDevMode) {
        _err = new SocketError_1.SocketError(500, err.message);
    }
    else {
        _err = new SocketError_1.SocketError(500);
    }
    info.code = _err.code;
    if (info.event) {
        ctrl.socket.emit(info.event, ctrl.error(_err.message, _err.code));
    }
    http_route_1.handleLog(err, ctrl, method);
    finish(ctrl, info);
}
//# sourceMappingURL=websocket-event.js.map