import { ws } from "../bootstrap/index";
import { SocketError } from "../tools/SocketError";
import { WebSocket } from "../tools/interfaces";
import { realDB, activeEvent } from "../tools/symbols";
import { WebSocketController } from "../controllers/WebSocketController";
import { EventMap } from "../tools/EventMap";
import { handleLog } from "./http-route";
import { logRequest } from "./http-init";
import initHandler from "./websocket-init";
import cookieHandler, { handler2 as cookieHandler2 } from "./websocket-cookie";
import sessionHandler, { handler2 as sessionHandler2 } from "./websocket-session";
import dbHandler from "./websocket-db";
import authHandler from "./websocket-auth";
import { getFuncParams } from "../tools/functions-inner";
import last = require("lodash/last");
import { isDevMode } from '../../init';

let importedNamesapces: string[] = [];
type SocketEventInfo = {
    time: number;
    event: string;
    code: number;
};

export function tryImport(nsp: string) {
    if (!importedNamesapces.includes(nsp)) return;

    importedNamesapces.push(nsp);
    ws.of(nsp)
        .use(initHandler)
        .use(cookieHandler)
        .use(cookieHandler2)
        .use(sessionHandler)
        .use(sessionHandler2)
        .use(dbHandler)
        .use(authHandler)
        .on("connection", (socket: WebSocket) => {
            for (let event in EventMap[nsp]) {
                socket.on(event, (...data) => {
                    handleEvent(socket, nsp, event, data);
                });
            }

            socket.on("error", (err: Error) => {
                let ctrl = new WebSocketController(socket);
                handleError(err, {
                    time: Date.now(),
                    event: "",
                    code: 500
                }, ctrl, socket.protocol.toUpperCase());
            });
        });
}

async function handleEvent(socket: WebSocket, nsp: string, event: string, data: any[]) {
    let { Class, method } = EventMap[nsp][event],
        ctrl: WebSocketController = null,
        info: SocketEventInfo = {
            time: Date.now(),
            event,
            code: 200
        };

    try {
        socket[activeEvent] = nsp + (last(nsp) == "/" ? "" : "/") + event;
        ctrl = new Class(socket);

        // HACK, because the activeEvent stored in the socket object will be 
        // frequently changed time to time a new event activated, so when the 
        // first time access to `ctrl.event` properties, the active event will 
        // be copied to the controller instance, so that no matter how it 
        // changed, the instance will always access to the original event when 
        // it was emitted.
        ctrl.event;

        // if the socket has been disconnected before calling the actual method, 
        // return immediately without running any checking procedure, and don't 
        // call the method.
        if (socket.disconnected || false === (await ctrl.before())) return;

        let _data = await ctrl[method](...getArguments(ctrl, method, data));

        // Send data to the client.
        _data === undefined || socket.emit(event, _data);

        finish(ctrl, info);

        await ctrl.after();
    } catch (err) {
        ctrl = ctrl || new WebSocketController(socket);

        await handleError(err, info, ctrl, method);
    }
}

function getArguments(ctrl: WebSocketController, method: string, data: any[]) {
    let args: any[] = [],
        fnParams = getFuncParams(ctrl[method]),
        socketParams = ["websocket", "socket", "sock", "webSocket"];

    // Dependency Injection
    // try to convert parameters to proper types according to the definition of 
    // the method.
    let meta: any[] = Reflect.getMetadata("design:paramtypes", ctrl, method);

    for (let i = 0; i < meta.length; i++) {
        if (meta[i] == Object && socketParams.includes(fnParams[i]))
            args[i] = ctrl.socket;
        else
            args[i] = data.shift();
    }

    return args;
}

function finish(ctrl: WebSocketController, info: SocketEventInfo) {
    let socket = ctrl.socket;

    // If has db connection bound to the socket, release.
    if (socket[realDB])
        socket[realDB].release();

    ctrl.emit("finish", socket);
    logRequest(info.time, socket.protocol.toUpperCase(), info.code, info.event);
}

async function handleError(
    err: any,
    info: SocketEventInfo,
    ctrl: WebSocketController,
    method?: string
) {
    let _err: SocketError; // The original error.

    if (err instanceof SocketError) {
        _err = err;
    } else if (err instanceof Error && isDevMode) {
        _err = new SocketError(500, err.message);
    } else {
        _err = new SocketError(500);
    }

    info.code = _err.code;

    // Send error to the client.
    if (info.event) {
        ctrl.socket.emit(info.event, ctrl.error(_err.message, _err.code));
    }

    handleLog(err, ctrl, method);
    finish(ctrl, info);
}