import random = require("lodash/random");
import { HttpController } from "../controllers/HttpController";
import { WebSocketController } from "../controllers/WebSocketController";
import { App, RouteHandler } from "webium";
import { interceptAsync } from 'function-intercepter';
import { HttpError } from './HttpError';
import { SocketError } from './SocketError';
import { routeMap, eventMap } from './RouteMap';
import {
    ControllerDecorator,
    WebSocketEventDecorator,
    HttpRoute
} from './interfaces';

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

let router: App,
    handle: (route: string) => RouteHandler,
    tryImport: (nsp: string) => void;

/** Binds the method to a specified socket event. */
export function event(name: string): WebSocketEventDecorator;
export function event(name: string, Class: typeof WebSocketController, method: string): void;
export function event(name: string, Class?: typeof WebSocketController, method?: string) {
    if (arguments.length === 1) {
        return (proto: WebSocketController, prop: string) => {
            (async () => {
                await proto.Class.finishLoad();

                let nsp: string = proto.Class.nsp || "/";
                let data = {
                    prefix: nsp,
                    route: name,
                    ctor: proto.Class
                };
                let key = eventMap.keyof(data);

                eventMap.add(key, prop);

                if (!tryImport)
                    tryImport = require("../handlers/websocket-event").tryImport;

                if (!eventMap.isLocked(key)) {
                    eventMap.lock(key);
                    tryImport(nsp);
                }
            })();
        };
    } else {
        return event(name)(Class.prototype, method);
    }
}

function _route(...args: any[]) {
    let route: string = args.length % 2 ? args[0] : `${args[0]} ${args[1]}`;

    if (args.length <= 2) {
        return (proto: HttpController, prop: string) => {
            (async () => {
                await proto.Class.finishLoad();

                let __route = route.split(/\s+/);
                let method = _route[0] === "SSE" ? "GET" : __route[0];
                let path = (proto.Class.baseURI || "") + __route[1];
                let data = {
                    prefix: method,
                    route: path,
                    ctor: proto.Class
                };
                let key = routeMap.keyof(data);

                routeMap.add(key, prop);

                if (!router || !handle) {
                    router = require("../bootstrap/index").router;
                    handle = require("../handlers/http-route").getRouteHandler;
                }

                if (!routeMap.isLocked(key)) {
                    routeMap.lock(key);
                    router.method(method, path, handle(key));
                }
            })();
        };
    } else {
        let proto = (args.length == 4 ? args[2] : args[1]).prototype,
            method = args.length == 4 ? args[3] : args[2];

        return _route(route)(proto, method);
    }
}

/** Sets HTTP routes. */
export const route: HttpRoute = <any>_route;

route.delete = function (...args: any[]) {
    return _route("DELETE", ...args);
};

route.get = function (...args: any[]) {
    return _route("GET", ...args);
}

route.head = function (...args: any[]) {
    return _route("HEAD", ...args);
};

route.patch = function (...args: any[]) {
    return _route("PATCH", ...args);
};

route.post = function (...args: any[]) {
    return _route("POST", ...args);
};

route.put = function (...args: any[]) {
    return _route("PUT", ...args);
};

route.sse = function (...args: any[]) {
    return _route("SSE", ...args);
}