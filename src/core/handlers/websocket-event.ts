import { ws } from "../bootstrap/index";
import { SocketError } from "../tools/SocketError";
import { WebSocket, Session } from "../tools/interfaces";
import { realDB, activeEvent } from "../tools/symbols";
import { WebSocketController } from "../controllers/WebSocketController";
import { handleLog } from "./http-route";
import { logRequest } from "./http-init";
import initHandler from "./websocket-init";
import cookieHandler, { handler2 as cookieHandler2 } from "./websocket-cookie";
import sessionHandler, { handler2 as sessionHandler2 } from "./websocket-session";
import dbHandler from "./websocket-db";
import authHandler from "./websocket-auth";
import { isOwnMethod } from "../tools/functions-inner";
import last = require("lodash/last");
import { isDevMode } from '../../init';
import { eventMap } from '../tools/RouteMap';
import { ThenableAsyncGenerator } from "thenable-generator";

let importedNamesapces: string[] = [];
type SocketEventInfo = {
    time: number;
    event: string;
    code: number;
};

export function tryImport(nsp: string) {
    if (importedNamesapces.includes(nsp)) return;

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
            for (let item of eventMap.values()) {
                socket.on(item.route, (...data) => {
                    handleEvent(eventMap.keyFor(item), socket, data);
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

async function handleEvent(key: string, socket: WebSocket, data: any[]) {
    let mod = eventMap.resolve(key),
        methods = eventMap.methods(key),
        { prefix: nsp, route: event } = eventMap.get(key),
        ctrl: WebSocketController = null,
        initiated = false,
        info: SocketEventInfo = { time: Date.now(), event, code: 200 };

    try {
        socket[activeEvent] = nsp + (last(nsp) == "/" ? "" : "/") + event;
        ctrl = mod.create(socket);

        for (let method of methods) {
            if (!isOwnMethod(ctrl, method)) {
                eventMap.del(key, method);
                continue;
            } else if (!initiated) {
                // If the socket has been disconnected before calling the actual
                // method, return immediately without running any checking 
                // procedure, and don't call the method.
                if (socket.disconnected || false === (await ctrl.before()))
                    return;

                initiated = true;
            }

            let generator = new ThenableAsyncGenerator(ctrl[method](
                ...getArguments(ctrl, method, data)
            ));
            let value: any, done: boolean;

            // Fetch any data produced by the method, whether they are returned 
            // or yielded.
            while ({ value, done } = await generator.next()) {
                // Send data to the client.
                (value === undefined) || socket.emit(event, value);

                if (done) {
                    break;
                }
            }
        }

        if (initiated) {
            await ctrl.after();
            finish(ctrl, info);
        }
    } catch (err) {
        ctrl = ctrl || new WebSocketController(socket);

        await handleError(err, info, ctrl);
    }
}

function getArguments(ctrl: WebSocketController, method: string, data: any[]) {
    let args: any[] = [];

    // Dependency Injection
    // Try to convert parameters to proper types according to the definition of 
    // the method.
    let meta: any[] = Reflect.getMetadata("design:paramtypes", ctrl, method);

    for (let type of meta) {
        if (type === WebSocket) {
            args.push(ctrl.socket);
        } else if (type === Session) {
            args.push(ctrl.socket.session);
        } else {
            args.push(data.shift());
        }
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
    } else if (err instanceof Error) {
        _err = new SocketError(500, isDevMode ? err.message : null);
    } else {
        _err = new SocketError(500, String(err));
    }

    info.code = _err.code;

    // Send error to the client.
    if (info.event) {
        ctrl.socket.emit(info.event, ctrl.error(_err.message, _err.code));
    }

    handleLog(err, ctrl, method);
    finish(ctrl, info);
}