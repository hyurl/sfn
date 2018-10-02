import { isTypeScript } from '../../../init';
import { config, isDevMode } from "../../bootstrap/ConfigLoader";
import { ws } from "../../bootstrap/index";
import { SocketError } from "../../tools/SocketError";
import { WebSocket } from "../../tools/interfaces";
import { callsiteLog, callMethod, getFuncParams, callIntercepterChain } from "../../tools/functions-inner";
import { realDB } from "../../tools/symbols";
import { WebSocketController } from "../../controllers/WebSocketController";
import { EventMap } from "../../tools/EventMap";
import { handleLog } from "./http-route";
import { logRequest } from "./http-init";
import initHandler from "./websocket-init";
import cookieHandler, { handler2 as cookieHandler2 } from "./websocket-cookie";
import sessionHandler, { handler2 as sessionHandler2 } from "./websocket-session";
import dbHandler from "./websocket-db";
import authHandler from "./websocket-auth";

if (ws) {
    for (let nsp in EventMap) {
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
}

type SocketEventInfo = {
    time: number;
    event: string;
    code: number;
};

function handleEvent(socket: WebSocket, nsp: string, event: string, data: any[]): void {
    let { Class, method } = EventMap[nsp][event],
        ctrl: WebSocketController = null,
        info: SocketEventInfo = {
            time: Date.now(),
            event,
            code: 200
        };

    // Handle the procedure in a Promise context.
    new Promise((resolve, reject) => {
        try {
            let handleNext = getNextHandler(method, data, resolve, reject);

            if (Class.length === 2) {
                ctrl = new Class(socket, handleNext);
            } else {
                ctrl = new Class(socket);
                handleNext(ctrl);
            }
        } catch (err) {
            reject(err);
        }
    }).then((_data: any) => {
        if (_data !== undefined) {
            // Send data to the client.
            socket.emit(event, _data);
        }
        finish(ctrl, info);
    }).then(() => {
        return ctrl.after();
    }).then(result => {
        return result === false || ctrl.socket.disconnect
            ? result
            : callIntercepterChain(Class.AfterIntercepters[method], ctrl);
    }).catch((err: Error) => {
        ctrl = ctrl || new WebSocketController(socket);

        handleError(err, info, ctrl, method);
    });
}

function getNextHandler(
    method: string,
    data: any[],
    resolve: (value: any) => any,
    reject: (err: Error) => void
) {
    return (ctrl: WebSocketController) => {
        let { BeforeIntercepters, RequireAuth } = ctrl.Class;

        Promise.resolve(ctrl.before()).then(result => {
            if (result === false || ctrl.socket.disconnected)
                return result;
            else
                return callIntercepterChain(BeforeIntercepters[method], ctrl, true);
        }).then(result => {
            if (result === false || ctrl.socket.disconnected) {
                // if the socket has been closed before calling the actual method,
                // resolve the Promise immediately without running any checking 
                // procedure, and don't call the method.
                return resolve(null);
            }

            // Handle authentication.
            if (RequireAuth.includes(method) && !ctrl.authorized)
                throw new SocketError(401);

            return getResult(ctrl, method, data);
        }).then(resolve).catch(reject);
    }
}

function getResult(ctrl: WebSocketController, method: string, data: any[]) {
    return callMethod(ctrl, ctrl[method], ...getArguments(ctrl, method, data));
}

function getArguments(ctrl: WebSocketController, method: string, data: any[]) {
    let args: any[] = [],
        fnParams = getFuncParams(ctrl[method]),
        socketParams = ["websocket", "socket", "sock", "webSocket"];

    // Dependency Injection
    if (isTypeScript) {
        // try to convert parameters to proper types according to 
        // the definition of the method.
        let meta: any[] = Reflect.getMetadata("design:paramtypes", ctrl, method);

        for (let i = 0; i < meta.length; i++) {
            if (meta[i] == Object && socketParams.includes(fnParams[i]))
                args[i] = ctrl.socket;
            else
                args[i] = data.shift();
        }
    } else {
        for (let i = 0; i < fnParams.length; i++) {
            if (socketParams.includes(fnParams[i]))
                args[i] = ctrl.socket;
            else
                args[i] = data.shift();
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

function handleError(err: any, info: SocketEventInfo, ctrl: WebSocketController, method?: string) {
    let _err: Error = err; // The original error.

    if (!(err instanceof SocketError)) {
        if (err instanceof Error && config.server.error.show)
            err = new SocketError(500, err.message);
        else
            err = new SocketError(500);
    }

    info.code = (<SocketError>err).code;

    // Send error to the client.
    if (info.event) {
        ctrl.socket.emit(info.event, ctrl.error(err.message, info.code));
    }

    handleLog(_err, ctrl, method);
    finish(ctrl, info);

    if (isDevMode && !(_err instanceof SocketError)) {
        callsiteLog(_err);
    }
}