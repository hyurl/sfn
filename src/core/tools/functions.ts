import random = require("lodash/random");
import { App, RouteHandler, HttpMethods } from "webium";
import { interceptAsync, intercept } from 'function-intercepter';
import { HttpController } from "../controllers/HttpController";
import { WebSocketController } from "../controllers/WebSocketController";
import { StatusException } from './StatusException';
import { routeMap, eventMap } from './RouteMap';
import { traceModulePath } from './internal/module';
import { copyFuncProps } from "./internal/index";
import { Service } from './Service';
import {
    ControllerDecorator,
    WebSocketDecorator,
    HttpDecorator
} from './interfaces';
import { Controller } from '../controllers/Controller';
import * as cors from "sfn-cors";
import * as moment from "moment";

// Expose some internal functions as utilities to the public API.
export { green, grey, red, yellow } from "./internal/color";
export { tryLogError } from "./internal/error";
export { isOwnMethod, isSubClassOf, ensureType, define } from "./internal/index";
export { moduleExists, createImport } from "./internal/module";
export { serve as serveRepl, connect as connectRepl } from "./internal/repl";

/** Pauses the execution in an asynchronous operation. */
export function sleep(timeout: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeout));
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
        str += chars[random(0, max)];
    }
    return str;
}

/** Injects CSRF Token into forms. */
export function injectCsrfToken(html: string, token: string): string {
    var ele = `<input type="hidden" name="x-csrf-token" value="${token}">`,
        matches = html.match(/<form\s+.*?>/g);

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
export const requireAuth: ControllerDecorator = interceptAsync().before(
    function (this: Controller) {
        if (!this.authorized) {
            if (this instanceof HttpController) {
                if (typeof this.fallbackTo === "string") {
                    this.res.redirect(this.fallbackTo, 302);
                } else if (this.fallbackTo) {
                    this.res.send(this.fallbackTo);
                } else {
                    throw new StatusException(401);
                }

                return intercept.BREAK;
            } else {
                throw new StatusException(401);
            }
        }
    }
);

let router: App,
    handle: (route: string) => RouteHandler,
    wsTryImport: (nsp: string) => void;

/** Binds the method to a specified socket event. */
export function event(name: string): WebSocketDecorator {
    return (proto: WebSocketController, prop: string) => {
        let modPath = traceModulePath(app.controllers.path);

        if (!modPath)
            return;

        let nsp: string = "";

        if (proto.ctor.hasOwnProperty("nsp")) {
            nsp = proto.ctor["nsp"];
        }

        let data = {
            prefix: nsp,
            route: name,
            name: app.controllers.resolve(modPath),
        };
        let key = eventMap.keyFor(data);

        eventMap.add(key, prop);

        if (!wsTryImport)
            wsTryImport = require("../handlers/websocket-event").tryImport;

        if (!eventMap.isLocked(key)) {
            eventMap.lock(key);
            wsTryImport(nsp);
        }
    };
}

/** Binds the method to a specified URL route. */
export function route(path: string): HttpDecorator;
export function route(method: HttpMethods | "SSE", path: string): HttpDecorator;
export function route(method: string, path?: string): HttpDecorator {
    return (proto: HttpController, prop: string) => {
        let modPath = traceModulePath(app.controllers.path);
        let baseURI: string = "";

        if (proto.ctor.hasOwnProperty("baseURI")) {
            baseURI = proto.ctor["baseURI"];
        }

        if (!modPath)
            return;

        if (!path) {
            let parts = method.split(/\s+/);
            method = parts[0] === "SSE" ? "GET" : parts[0];
            path = parts[1];
        } else if (method === "SSE") {
            method = "GET";
        }

        path = baseURI + path;

        let data = {
            prefix: method,
            route: path,
            name: app.controllers.resolve(modPath),
        };
        let key = routeMap.keyFor(data);

        routeMap.add(key, prop);

        if (!router || !handle) {
            router = require("../bootstrap/index").router;
            handle = require("../handlers/http-route").getRouteHandler;
        }

        if (!routeMap.isLocked(key)) {
            routeMap.lock(key);
            router.method(<HttpMethods>method, path, handle(key));

            if (method === "POST" && proto.ctor.hasOwnProperty("cors") &&
                !router.contains("OPTIONS", path)) {
                router.method("OPTIONS", path, (req, res) => {
                    cors(proto.ctor["cors"], req, res);
                    res.end();
                }, true);
            }
        }
    };
}

route.delete = function (path: string) {
    return route("DELETE", path);
};

route.get = function (path: string) {
    return route("GET", path);
}

route.head = function (path: string) {
    return route("HEAD", path);
};

route.patch = function (path: string) {
    return route("PATCH", path);
};

route.post = function (path: string) {
    return route("POST", path);
};

route.put = function (path: string) {
    return route("PUT", path);
};

route.sse = function (path: string) {
    return route("SSE", path);
};

/** Throttles the calling rate of the method. */
export function throttle(
    key: string,
    interval = 0,
    error = void 0
): MethodDecorator {
    return (proto: Service, prop: string, desc: PropertyDescriptor) => {
        let original: (...args: any[]) => any = desc.value;

        desc.value = proto[prop] = copyFuncProps(
            original,
            function (this: Service) {
                return this.throttle<any>(
                    key,
                    original.bind(this, ...arguments),
                    interval,
                    error
                );
            }
        );
    };
}

/** Queues the method call. */
export function queue(key: string): MethodDecorator {
    return (proto: Service, prop: string, desc: PropertyDescriptor) => {
        let original: (...args: any[]) => any = desc.value;

        desc.value = proto[prop] = copyFuncProps(
            original,
            function (this: Service) {
                return this.queue<any>(key, original.bind(this, ...arguments));
            }
        );
    };
}

/**
 * Gets the current UNIX timestamp or converts a given time to UNIX timestamp.
 */
export function timestamp(time?: number | string | Date) {
    if (time === undefined) {
        return Math.round(Date.now() / 1000);
    } else if (typeof time === "number") {
        // Compatible fix with milliseconds
        if (String(time).length === 13) {
            time = Math.round(time / 1000);
        }

        return time;
    } else if (typeof time === "string") {
        if (/\d{4}-\d{1,2}-\d{1,2}\b/.test(time)) {
            time = new Date(time);
        } else {
            time = new Date(moment().format("YYYY-MM-DD ") + time);
        }
    }

    return moment(time).unix();
}