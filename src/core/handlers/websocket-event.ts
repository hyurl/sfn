import { ws } from "../bootstrap/index";
import { HttpException } from "../tools/HttpException";
import { WebSocket, Session } from "../tools/interfaces";
import { WebSocketController, activeEvent } from "../controllers/WebSocketController";
import { logRequest } from "./http-init";
import initHandler from "./websocket-init";
import cookieHandler, { handler2 as cookieHandler2 } from "./websocket-cookie";
import sessionHandler, { handler2 as sessionHandler2 } from "./websocket-session";
import isOwnMethod from "@hyurl/utils/isOwnMethod";
import typeAs from "@hyurl/utils/typeAs";
import { tryLogError } from "../tools/internal/error";
import { eventMap } from '../tools/RouteMap';
import { isIterableIterator, isAsyncIterableIterator } from "check-iterable";
import last = require("lodash/last");

let importedNamespaces: string[] = [];
type SocketEventInfo = {
    time: number;
    event: string;
    code: number;
};

export function tryImport(nsp: string) {
    if (importedNamespaces.includes(nsp)) return;

    importedNamespaces.push(nsp);
    ws.of(nsp)
        .use(initHandler)
        .use(cookieHandler)
        .use(cookieHandler2)
        .use(sessionHandler)
        .use(sessionHandler2)
        .on("connection", (socket: WebSocket) => {
            for (let item of eventMap.values()) {
                socket.on(item.route, (...data) => {
                    handleEvent(eventMap.keyFor(item), socket, data);
                });
            }

            socket.on("error", (err: Error) => {
                let ctrl = new (class extends WebSocketController { })(socket);
                handleError(err, {
                    time: Date.now(),
                    event: "",
                    code: 500
                }, ctrl, socket.protocol.toUpperCase() + " id: " + socket.id);
            });
        });
}

async function handleEvent(key: string, socket: WebSocket, data: any[]) {
    let Controller = eventMap.resolve(key);
    let methods = eventMap.methods(key);
    let { prefix: nsp, route: event } = eventMap.get(key);
    let ctrl: WebSocketController = null;
    let initiated = false;
    let info: SocketEventInfo = { time: Date.now(), event, code: 200 };
    let callback: Callable = typeAs(last(data), Function);

    try {
        socket[activeEvent] = nsp + (last(nsp) == "/" ? "" : "/") + event;
        ctrl = new Controller(socket);

        for (let method of methods) {
            if (!isOwnMethod(ctrl, method)) {
                eventMap.del(key, method);
                continue;
            } else if (!initiated) {
                // If the socket has been disconnected before calling the actual
                // method, return immediately without running any checking 
                // procedure, and don't call the method.
                if (socket.disconnected)
                    return;

                // Initiate the controller.
                await ctrl.init?.();
                initiated = true;
            }

            let options = { passCallback: false };
            let args = getArguments(ctrl, method, data, options);
            let result = await ctrl[method](...args);

            if (isIterableIterator(result) || isAsyncIterableIterator(result)) {
                while (true) {
                    let segment = await (<AsyncGenerator>result).next();
                    socket.emit(event, segment);

                    if (segment.done) {
                        break;
                    }
                }
            } else if (callback) {
                if (!options.passCallback) {
                    callback(result);
                }
            } else {
                socket.emit(event, result);
            }
        }

        if (initiated) {
            await ctrl.destroy?.();
            finish(ctrl, info);
        }
    } catch (err) {
        ctrl = ctrl || new (class extends WebSocketController { })(socket);

        await handleError(err, info, ctrl);
    }
}

function getArguments(
    ctrl: WebSocketController,
    method: string,
    data: any[],
    options: { passCallback: boolean; }
) {
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

            if (type === Function) {
                options.passCallback = true;
            }
        }
    }

    return args;
}

function finish(ctrl: WebSocketController, info: SocketEventInfo) {
    let socket = ctrl.socket;

    ctrl.emit("finish", socket);
    logRequest(info.time, socket.protocol.toUpperCase(), info.code, info.event);
}

async function handleError(
    err: any,
    info: SocketEventInfo,
    ctrl: WebSocketController,
    stack?: string
) {
    let _err = HttpException.from(err);

    info.code = _err.code;

    // Send error to the client.
    if (info.event) {
        ctrl.socket.emit(info.event, ctrl.fail(_err.message, _err.code));
    }

    tryLogError(err, stack);
    finish(ctrl, info);
}
