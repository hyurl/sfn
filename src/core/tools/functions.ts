import random = require("lodash/random");
import { HttpController } from "../controllers/HttpController";
import { WebSocketController } from "../controllers/WebSocketController";
import { RouteMap } from "./RouteMap";
import { EventMap } from "./EventMap";
import {
    ControllerDecorator,
    WebSocketEventDecorator,
    HttpRoute
} from './interfaces';
import { App, RouteHandler } from "webium";
import { interceptAsync } from 'function-intercepter';
import { HttpError } from './HttpError';
import { SocketError } from './SocketError';

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
        str += chars[random(0, max)];
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

/** Requires authentication when calling the method. */
export const requireAuth: ControllerDecorator = interceptAsync().before(function () {
    if (!this.authorized) {
        if (this instanceof HttpController) {
            if (this.fallbackTo) {
                this.res.redirect(this.fallbackTo, 302);
                return false;
            } else {
                throw new HttpError(401);
            }
        } else {
            throw new SocketError(401);
        }
    }
});

let app: App,
    handle: (route: string) => RouteHandler,
    tryImport: (nsp: string) => void;

/** Binds the method to a specified socket event. */
export function event(name: string): WebSocketEventDecorator;
export function event(name: string, Class: typeof WebSocketController, method: string): void;
export function event(name: string, Class?: typeof WebSocketController, method?: string) {
    if (arguments.length === 1) {
        return (proto: WebSocketController, prop: string) => {
            let nsp: string = proto.Class.nsp || "/";

            if (!EventMap[nsp]) EventMap[nsp] = {};
            if (!tryImport)
                tryImport = require("../handlers/websocket-event").tryImport;

            tryImport(nsp);
            EventMap[nsp][name] = {
                Class: proto.Class,
                method: prop
            };
        };
    } else {
        return event(name)(Class.prototype, method);
    }
}

function _route(...args) {
    let route: string = args.length % 2 ? args[0] : `${args[0]} ${args[1]}`;

    if (args.length <= 2) {
        return (proto: HttpController, prop: string) => {
            RouteMap[route] = {
                Class: proto.Class,
                method: prop
            };

            let __route = route.split(/\s+/),
                method = _route[0] === "SSE" ? "GET" : __route[0],
                path = (proto.Class.baseURI || "") + __route[1];

            if (!app || !handle) {
                app = require("../bootstrap/index").app;
                handle = require("../handlers/http-route").getRouteHandler;
            }

            app.method(method, path, handle(route), true);
        };
    } else {
        let proto = (args.length == 4 ? args[2] : args[1]).prototype,
            method = args.length == 4 ? args[3] : args[2];

        return _route(route)(proto, method);
    }
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