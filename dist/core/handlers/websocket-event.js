"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../bootstrap/index");
const SocketError_1 = require("../tools/SocketError");
const interfaces_1 = require("../tools/interfaces");
const symbols_1 = require("../tools/symbols");
const WebSocketController_1 = require("../controllers/WebSocketController");
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
const RouteMap_1 = require("../tools/RouteMap");
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
        for (let item of RouteMap_1.eventMap.values()) {
            socket.on(item.route, (...data) => {
                handleEvent(RouteMap_1.eventMap.keyof(item), socket, data);
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
async function handleEvent(key, socket, data) {
    let mod = RouteMap_1.eventMap.resolve(key), methods = RouteMap_1.eventMap.methods(key), { prefix: nsp, route: event } = RouteMap_1.eventMap.get(key), ctrl = null, initiated = false, info = { time: Date.now(), event, code: 200 };
    try {
        socket[symbols_1.activeEvent] = nsp + (last(nsp) == "/" ? "" : "/") + event;
        ctrl = mod.create(socket);
        for (let method of methods) {
            if (!functions_inner_1.isOwnMethod(ctrl, method)) {
                RouteMap_1.eventMap.del(key, method);
                continue;
            }
            else if (!initiated) {
                ctrl.event;
                if (socket.disconnected || false === (await ctrl.before()))
                    return;
            }
            let _data = await ctrl[method](...getArguments(ctrl, method, data));
            _data === undefined || socket.emit(event, _data);
        }
        if (initiated) {
            await ctrl.after();
            finish(ctrl, info);
        }
    }
    catch (err) {
        ctrl = ctrl || new WebSocketController_1.WebSocketController(socket);
        await handleError(err, info, ctrl);
    }
}
function getArguments(ctrl, method, data) {
    let args = [];
    let meta = Reflect.getMetadata("design:paramtypes", ctrl, method);
    for (let type of meta) {
        if (type === interfaces_1.WebSocket) {
            args.push(ctrl.socket);
        }
        else if (type === interfaces_1.Session) {
            args.push(ctrl.socket.session);
        }
        else {
            args.push(data.shift());
        }
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