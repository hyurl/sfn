import { Controller } from "../controllers/Controller";
import { HttpController } from "../controllers/HttpController";
import { WebSocketController } from "../controllers/WebSocketController";
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
export var requireAuth: ControllerDecorator = (proto: Controller, prop: string) => {
    let Class = <typeof Controller>proto.constructor;

    if (!Class.hasOwnProperty("RequireAuth"))
        Class.RequireAuth = [];

    if (!Class.RequireAuth.includes(prop))
        Class.RequireAuth.push(prop);
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