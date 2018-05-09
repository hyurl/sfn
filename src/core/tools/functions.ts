import { HttpController } from "../controllers/HttpController";
import { WebSocketController } from "../controllers/WebSocketController";
import { RouteMap } from "./RouteMap";
import { EventMap } from "./EventMap";

export * from "sfn-xss";

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

interface HttpDecorator extends Function {
    (proto: HttpController, prop: string): void;
}

interface WebSocketDecorator extends Function {
    (proto: WebSocketController, prop: string): void;
}

/** Binds the method to a specified socket event. */
export function event(name: string): WebSocketDecorator;
export function event(name: string, Controller: typeof WebSocketController, method: string): void;
export function event(...args) {
    if (args.length === 1) {
        return (proto: WebSocketController, prop: string) => {
            EventMap[args[0]] = {
                Class: <typeof WebSocketController>proto.constructor,
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
        let Class = <typeof HttpController>proto.constructor;

        if (!Class.hasOwnProperty("UploadFields"))
            Class.UploadFields = {};

        Class.UploadFields[prop] = fields;
    }
}

/** Requires authentication when calling the method. */
export var requireAuth: HttpDecorator = (proto: HttpController, prop: string) => {
    let Class = <typeof HttpController>proto.constructor;

    if (!Class.hasOwnProperty("UploadFields"))
        Class.RequireAuth = [];

    if (!Class.RequireAuth.includes(prop))
        Class.RequireAuth.push(prop);
}

function _route(...args) {
    let route: string = args.length % 2 ? args[0] : `${args[0]} ${args[1]}`;

    if (args.length === 1 || args.length === 2) {
        return (proto: HttpController, prop: string) => {
            RouteMap[route] = {
                Class: <typeof HttpController>proto.constructor,
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

interface RouteFunction extends Function {
    /** Binds the method to a specified URL route. */
    (route: string): HttpDecorator;
    (reqMethod: string, path: string): HttpDecorator;
    (route: string, Class: typeof HttpController, method: string): void
    (reqMethod: string, path: string, Class: typeof HttpController, method: string): void;
    delete(path: string): HttpDecorator;
    delete(path: string, Class: typeof HttpController, method: string): void;
    get(path: string): HttpDecorator;
    get(path: string, Class: typeof HttpController, method: string): void;
    head(path: string): HttpDecorator;
    head(path: string, Class: typeof HttpController, method: string): void;
    post(path: string): HttpDecorator;
    patch(path: string): HttpDecorator;
    patch(path: string, Class: typeof HttpController, method: string): void;
    post(path: string, Class: typeof HttpController, method: string): void;
    put(path: string);
    put(path: string, Class: typeof HttpController, method: string): void;
}

export var route: RouteFunction = <any>_route;

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