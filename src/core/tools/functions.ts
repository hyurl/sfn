import * as dgram from "dgramx";
import { promisify } from "es6-promisify";
import pidusage = require("pidusage");
import values = require("lodash/values");
import { config } from "../bootstrap/ConfigLoader";
import { Controller } from "../controllers/Controller";
import { HttpController } from "../controllers/HttpController";
import { WebSocketController } from "../controllers/WebSocketController";
import { red, grey, green } from "./functions-inner";
import { RouteMap } from "./RouteMap";
import { EventMap } from "./EventMap";

/** 
 * Generates a random number.
 * @param min The minimum number.
 * @param max The maximum number (inclusive).
 */
export function rand(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 
 * Generates a random string.
 * @param length The string length.
 * @param chars The possible characters.
 */
export function randStr(
    length = 5,
    chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
) {
    var str = "",
        max = chars.length - 1;
    for (let i = 0; i < length; i++) {
        str += chars[rand(0, max)];
    }
    return str;
}

/** Injects CSRF Token into forms. */
export function injectCsrfToken(html: string, token: string): string {
    var ele = `<input type="hidden" name="x-csrf-token" value="${token}">`,
        matches = html.match(/<form\s+.*>/g);

    if (matches) {
        for (let match of matches) {
            let i = html.indexOf(match) + match.length,
                j = html.indexOf("<", i),
                spaces = html.substring(i, j);
            html = html.substring(0, i) + spaces + ele + html.substring(i);
        }
    }
    return html;
}

export interface ControllerDecorator extends Function {
    (proto: Controller, prop: string): void;
}

/** Requires authentication when calling the method. */
export var requireAuth: ControllerDecorator = (
    proto: HttpController | WebSocketController,
    prop: string
) => {
    if (!proto.Class.hasOwnProperty("RequireAuth"))
        proto.Class.RequireAuth = [];

    if (!proto.Class.RequireAuth.includes(prop))
        proto.Class.RequireAuth.push(prop);
}

export interface HttpDecorator extends Function {
    (proto: HttpController, prop: string): void;
}

export interface WebSocketDecorator extends Function {
    (proto: WebSocketController, prop: string): void;
}

interface WebSocketEventDecorator extends WebSocketDecorator { }

/** Binds the method to a specified socket event. */
export function event(name: string): WebSocketEventDecorator;
export function event(name: string, Controller: typeof WebSocketController, method: string): void;
export function event(...args) {
    if (args.length === 1) {
        return (proto: WebSocketController, prop: string) => {
            EventMap[args[0]] = {
                Class: proto.Class,
                method: prop
            };
        }
    } else {
        EventMap[args[0]] = {
            Class: args[1],
            method: args[2]
        }
    }
}

/** Allows the method accept file uploading with specified fields. */
export function upload(...fields: string[]): HttpDecorator {
    return (proto: HttpController, prop: string) => {
        if (!proto.Class.hasOwnProperty("UploadFields"))
            proto.Class.UploadFields = {};

        proto.Class.UploadFields[prop] = fields;
    }
}

function _route(...args) {
    let route: string = args.length % 2 ? args[0] : `${args[0]} ${args[1]}`;

    if (args.length === 1 || args.length === 2) {
        return (proto: HttpController, prop: string) => {
            RouteMap[route] = {
                Class: proto.Class,
                method: prop
            }
        }
    } else {
        RouteMap[route] = {
            Class: args.length === 4 ? args[2] : args[1],
            method: args.length === 4 ? args[3] : args[2]
        }
    }
}

interface HttpRouteDecorator extends HttpDecorator { }

interface HttpRoute extends Function {
    /** Binds the method to a specified URL route. */
    (route: string): HttpRouteDecorator;
    (reqMethod: string, path: string): HttpRouteDecorator;
    (route: string, Class: typeof HttpController, method: string): void
    (reqMethod: string, path: string, Class: typeof HttpController, method: string): void;
    delete(path: string): HttpRouteDecorator;
    delete(path: string, Class: typeof HttpController, method: string): void;
    get(path: string): HttpRouteDecorator;
    get(path: string, Class: typeof HttpController, method: string): void;
    head(path: string): HttpRouteDecorator;
    head(path: string, Class: typeof HttpController, method: string): void;
    post(path: string): HttpRouteDecorator;
    post(path: string, Class: typeof HttpController, method: string): void;
    patch(path: string): HttpRouteDecorator;
    patch(path: string, Class: typeof HttpController, method: string): void;
    put(path: string): HttpRouteDecorator;
    put(path: string, Class: typeof HttpController, method: string): void;
}

/** Sets HTTP routes. */
export var route: HttpRoute = <any>_route;

route.delete = function (...args) {
    return _route("DELETE", ...args);
};

route.get = function (...args) {
    return _route("GET", ...args);
}

route.head = function (...args) {
    return _route("HEAD", ...args);
};

route.patch = function (...args) {
    return _route("PATCH", ...args);
};

route.post = function (...args) {
    return _route("POST", ...args);
};

route.put = function (...args) {
    return _route("PUT", ...args);
};

export type ControllerIntercepter<T extends Controller = Controller> = (this: T, ctrl: T) => boolean | void | Promise<boolean | void>;

let intercepterWarning = "Using `@before()` and `@after()` decorators is deprecated, please install `function-intercepter` module instead.";
let intercepterWarned = false;
let tryWarnDeprecation = () => {
    if (!intercepterWarned) {
        process.emitWarning(intercepterWarning, "DeprecationWarning");
        intercepterWarned = true;
    }
}

/**
 * Adds an intercepter function to run before the actual method is called.
 * @param fn The intercepter function accepts an only argument which is the 
 *  controller instance, returning `false` in the function will break the 
 *  calling chain. Apart from that, in `HttpController`, calling response 
 *  methods like `res.send()`, `res.redirect()`, and in `WebSocketController` 
 *  disconnecting the socket will also break the chain. Once the chain is broke,
 *  the actual method will not be called as well.
 */
export function before<T extends Controller = Controller>(fn: ControllerIntercepter<T>): ControllerDecorator {
    tryWarnDeprecation();

    return (proto: HttpController | WebSocketController, prop: string) => {
        if (!proto.Class.hasOwnProperty("BeforeIntercepters")) {
            proto.Class.BeforeIntercepters = {};
        }

        if (proto.Class.BeforeIntercepters[prop] === undefined)
            proto.Class.BeforeIntercepters[prop] = [];

        proto.Class.BeforeIntercepters[prop].push(fn);
    }
}

/**
 * Adds an intercepter function to run after the actual method is called.
 * @param fn The intercepter function accepts an only argument which is the 
 *  controller instance, returning `false` in the function will break the 
 *  calling chain. You should not send any response in these intercepters.
 */
export function after<T extends Controller = Controller>(fn: ControllerIntercepter<T>): ControllerDecorator {
    tryWarnDeprecation();

    return (proto: HttpController | WebSocketController, prop: string) => {
        if (!proto.Class.hasOwnProperty("AfterIntercepters")) {
            proto.Class.AfterIntercepters = {};
        }

        if (proto.Class.AfterIntercepters[prop] === undefined)
            proto.Class.AfterIntercepters[prop] = [];

        proto.Class.AfterIntercepters[prop].push(fn);
    }
}

/** If Datagram server isn't enabled, it will return `null` */
export function getDgramClient(): dgram.Socket {
    let port = config.server.dgram.port;

    if (!config.server.dgram.enabled) {
        console.log(red`Datagram server isn't enabled!`);
        return null;
    }

    return dgram.createClient(`udp://127.0.0.1:${port}`);
}

export function vol2str(num: number): string {
    if (num > 1073741824) { // Db
        return (num / 1073741824).toFixed(3) + " Gb";
    } else if (num > 1048576) { // Mb
        return (num / 1048576).toFixed(3) + " Mb";
    } else if (num > 1024) {
        return (num / 1024).toFixed(3) + " Kb";
    } else {
        return num + " b";
    }
}

export function sec2str(sec: number): string {
    sec = Math.round(sec);
    let str = "";

    if (sec > 86400) {
        str += Math.ceil(sec / 86400) + "d";
        sec %= 86400;
    }
    if (sec > 3600) {
        str += Math.ceil(sec / 3600) + "h";
        sec %= 3600;
    }
    if (sec > 60) {
        str += Math.ceil(sec / 60) + "m";
        sec %= 60;
    }

    str += Math.ceil(sec) + "s";

    return str;
}

/**
 * Notifies the master process to reload workers.
 * @param timeout Sets a timeout to force reload.
 * @param cb Invoked when all workers are reloaded. Only works in master process,
 *  because the worker itself will exit.
 */
export function notifyReload(timeout: number = 100, cb?: () => void) {
    let client = getDgramClient();

    if (client) {
        client.bind(0);
        client.on("worker-reloaded", () => {
            console.log(green`Workers reloaded!`);
            client.close(() => {
                cb ? cb() : null;
            });
        }).emit("worker-reload", timeout, () => {
            console.log(grey`Reloading workers...`);
        });
    }
}

const pidusageAsync = promisify<any, number>(pidusage);

/**
 * List out all the workers.
 * @param withMaster When returning workers, prepend with the master.
 * @param cb Invoked when all workers are reloaded.
 */
export function listWorkers(
    cb: (err: Error, header: string[], body: Array<(string | number)[]>) => void,
    withMaster: boolean
) {
    let client = getDgramClient();

    if (!client) {
        cb(new Error("Datagram server isn't enabled."), null, null);
    }

    let header = ["id", "pid", "state", "reboot", "uptime", "memory", "cpu"],
        body: Array<(string | number)[]> = [],
        timer = setTimeout(() => {
            client.removeAllListeners("worker-list");
            client.close();
            cb(new Error("Unable to fetch worker information."), null, null);
        }, 5000);

    client.bind(0); // bind a random port so that the server can send feedback.
    client.on("worker-listed", async (workers: any[]) => {
        clearTimeout(timer);

        for (let worker of workers) {
            let stats = await pidusageAsync(worker.pid);

            worker.uptime = sec2str(worker.uptime);
            body.push(values(worker).concat([
                vol2str(stats.memory),
                Math.round(stats.cpu) + " %"
            ]));
        }

        client.close(() => cb(null, header, body));
    }).emit("worker-list", withMaster);
}