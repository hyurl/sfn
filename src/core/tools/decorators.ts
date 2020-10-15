import { App, RouteHandler, HttpMethods } from "webium";
import { interceptAsync, intercept } from 'function-intercepter';
import { HttpController } from "../controllers/HttpController";
import { WebSocketController } from "../controllers/WebSocketController";
import { HttpException } from './HttpException';
import { routeMap, eventMap } from './RouteMap';
import { traceModulePath } from './internal/module';
import { Service } from './Service';
import {
    ControllerDecorator,
    WebSocketDecorator,
    HttpDecorator
} from './interfaces';
import { Controller } from '../controllers/Controller';
import * as cors from "sfn-cors";
import trimEnd = require('lodash/trimEnd');
import isEmpty from '@hyurl/utils/isEmpty';
import wrap from "@hyurl/utils/wrap";
import { EFFECT_METHODS } from './functions';


let router: App;
let handle: (route: string) => RouteHandler;
let wsTryImport: (nsp: string) => void;

/** Binds the method to a specified socket event. */
export function event(name: string): WebSocketDecorator {
    return (proto: WebSocketController, prop: string) => {
        let modPath = traceModulePath(app.controllers.path);

        if (!modPath)
            return;

        let nsp: string = trimEnd(proto.ctor["nsp"] || "", "/");

        // if (isOwnKey(proto.ctor, "nsp")) {
        //     nsp = proto.ctor["nsp"];
        // }

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
        let baseURI: string = trimEnd(proto.ctor["baseURI"] || "", "/");

        // if (isOwnKey(proto.ctor, "baseURI")) {
        //     baseURI = proto.ctor["baseURI"];
        // }

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

            if (EFFECT_METHODS.includes(method) &&
                !isEmpty(proto.ctor["cors"]) &&
                !router.contains("OPTIONS", path)
            ) {
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
                    throw new HttpException(401);
                }

                return intercept.BREAK;
            } else {
                throw new HttpException(401);
            }
        }
    }
);

/** Throttles the calling rate of the method. */
export function throttle(key: string, interval = 1000): MethodDecorator {
    return (proto: Service, prop: string, desc: PropertyDescriptor) => {
        desc.value = proto[prop] = wrap(
            desc.value as (...args: any[]) => any,
            function (this: Service, target, ...args) {
                return this.throttle<any>(
                    key,
                    target.bind(this, ...args),
                    interval
                );
            }
        );
    };
}

/** Queues the method call. */
export function queue(key: string): MethodDecorator {
    return (proto: Service, prop: string, desc: PropertyDescriptor) => {
        desc.value = proto[prop] = wrap(
            desc.value as (...args: any[]) => any,
            function (this: Service, target, ...args) {
                return this.queue<any>(key, target.bind(this, ...args));
            }
        );
    };
}
