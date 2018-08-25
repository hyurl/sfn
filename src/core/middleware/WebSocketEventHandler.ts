import * as date from "sfn-date";
import chalk from "chalk";
import { Server } from "socket.io";
import { config, isDevMode } from "../bootstrap/ConfigLoader";
import { SocketError } from "../tools/SocketError";
import { WebSocket } from "../tools/interfaces";
import { callsiteLog, callMethod, getFuncParams, callFilterChain } from "../tools/functions-inner";
import { realDB } from "../tools/symbols";
import { WebSocketController } from "../controllers/WebSocketController";
import { EventMap } from "../tools/EventMap";
import { isTypeScript } from '../../init';

type SocketEventInfo = {
    time: number;
    event: string;
    code: number;
}

function finish(ctrl: WebSocketController, info: SocketEventInfo) {
    let socket = ctrl.socket;

    // If has db connection bound to the socket, release.
    if (socket[realDB])
        socket[realDB].release();

    ctrl.emit("finish", socket);

    // If it is dev mode, log runtime information.
    if (isDevMode) {
        let cost: number | string = Date.now() - info.time,
            dateTime: string = chalk.cyan(`[${date("Y-m-d H:i:s.ms")}]`),
            type: string = chalk.bold(socket.protocol.toUpperCase()),
            code: number = info.code,
            codeStr: string = code.toString();

        cost = chalk.cyan(`${cost}ms`);

        if (code < 200) {
            codeStr = chalk.blue(codeStr);
        } else if (code >= 200 && code < 300) {
            codeStr = chalk.green(codeStr);
        } else if (code >= 300 && code < 400) {
            codeStr = chalk.yellow(codeStr);
        } else {
            codeStr = chalk.red(codeStr);
        }

        console.log(`${dateTime} ${type} ${info.event} ${codeStr} ${cost}`);
    }
}

function handleError(err: any, ctrl: WebSocketController, info: SocketEventInfo) {
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
    } else {
        ctrl.logOptions.action = info.event = "unknown";
    }

    if (config.server.error.log) {
        // Log the original error to a file.
        ctrl.logger.error(_err.message);
    }

    finish(ctrl, info);

    if (isDevMode && !(_err instanceof SocketError)) {
        callsiteLog(_err);
    }
}

function getNextHandler(
    method: string,
    action: string,
    data: any[],
    resolve: Function,
    reject: Function
) {
    return (ctrl: WebSocketController) => {
        ctrl.logOptions.action = action;

        let { BeforeFilters, RequireAuth } = ctrl.Class;

        Promise.resolve(ctrl.before()).then(result => {
            if (result === false || ctrl.socket.disconnected)
                return result;
            else
                return callFilterChain(BeforeFilters[method], ctrl, true);
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

            let params: any[] = [],
                fnParams = getFuncParams(ctrl[method]),
                socketProps = ["websocket", "socket", "sock", "webSocket"];

            // Dependency Injection
            if (isTypeScript) {
                // try to convert parameters to proper types according to 
                // the definition of the method.
                let meta: Function[] = Reflect.getMetadata("design:paramtypes", ctrl, method);

                for (let i in meta) {
                    if (meta[i] == Object && socketProps.includes(fnParams[i]))
                        params[i] = ctrl.socket;
                    else
                        params[i] = data.shift();
                }
            } else {
                for (let i in fnParams) {
                    if (socketProps.includes(fnParams[i]))
                        params[i] = ctrl.socket;
                    else
                        params[i] = data.shift();
                }
            }

            resolve(callMethod(ctrl, ctrl[method], ...params));
        }).catch(err => {
            reject(err);
        });
    }
}

function handleEvent(socket: WebSocket, event: string, ...data: any[]): void {
    let { Class, method } = EventMap[event],
        className = Class.name === "default_1" ? "default" : Class.name,
        action = `${className}.${method} (${Class.filename})`,
        ctrl: WebSocketController = null,
        info: SocketEventInfo = {
            time: Date.now(),
            event,
            code: 200
        };

    // Handle the procedure in a Promise context.
    new Promise((resolve, reject) => {
        try {
            let handleNext = getNextHandler(method, action, data, resolve, reject);

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
            : callFilterChain(Class.AfterFilters[method], ctrl);
    }).catch((err: Error) => {
        ctrl = ctrl || new WebSocketController(socket);
        ctrl.logOptions.action = action;

        handleError(err, ctrl, info);
    });
}

export function handleWebSocketEvent(io: Server): void {
    io.on("connection", (socket: WebSocket) => {
        // Bind all socket controllers to the events of underlying socket.
        for (let event in EventMap) {
            socket.on(event, (...data) => {
                handleEvent(socket, event, ...data);
            });
        }

        socket.on("error", (err: Error) => {
            let ctrl = new WebSocketController(socket);
            handleError(err, ctrl, {
                time: Date.now(),
                event: "",
                code: 500
            });
        });
    });
}