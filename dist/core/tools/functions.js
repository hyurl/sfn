"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const random = require("lodash/random");
const HttpController_1 = require("../controllers/HttpController");
const RouteMap_1 = require("./RouteMap");
const EventMap_1 = require("./EventMap");
const function_intercepter_1 = require("function-intercepter");
const HttpError_1 = require("./HttpError");
const SocketError_1 = require("./SocketError");
function randStr(length = 5, chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    var str = "", max = chars.length - 1;
    for (let i = 0; i < length; i++) {
        str += chars[random(0, max)];
    }
    return str;
}
exports.randStr = randStr;
function injectCsrfToken(html, token) {
    var ele = `<input type="hidden" name="x-csrf-token" value="${token}">`, matches = html.match(/<form\s+.*>/g);
    if (matches) {
        for (let match of matches) {
            let i = html.indexOf(match) + match.length, j = html.indexOf("<", i), spaces = html.substring(i, j);
            html = html.substring(0, i) + spaces + ele + html.substring(i);
        }
    }
    return html;
}
exports.injectCsrfToken = injectCsrfToken;
exports.requireAuth = function_intercepter_1.interceptAsync().before(function () {
    if (!this.authorized) {
        if (this instanceof HttpController_1.HttpController) {
            if (this.fallbackTo) {
                this.res.redirect(this.fallbackTo, 302);
                return false;
            }
            else {
                throw new HttpError_1.HttpError(401);
            }
        }
        else {
            throw new SocketError_1.SocketError(401);
        }
    }
});
let router, handle, tryImport;
function event(name, Class, method) {
    if (arguments.length === 1) {
        return (proto, prop) => {
            let nsp = proto.Class.nsp || "/";
            if (!EventMap_1.EventMap[nsp])
                EventMap_1.EventMap[nsp] = {};
            if (!tryImport)
                tryImport = require("../handlers/websocket-event").tryImport;
            tryImport(nsp);
            EventMap_1.EventMap[nsp][name] = {
                Class: proto.Class,
                method: prop
            };
        };
    }
    else {
        return event(name)(Class.prototype, method);
    }
}
exports.event = event;
function _route(...args) {
    let route = args.length % 2 ? args[0] : `${args[0]} ${args[1]}`;
    if (args.length <= 2) {
        return (proto, prop) => {
            RouteMap_1.RouteMap[route] = {
                Class: proto.Class,
                method: prop
            };
            let __route = route.split(/\s+/), method = _route[0] === "SSE" ? "GET" : __route[0], path = (proto.Class.baseURI || "") + __route[1];
            if (!router || !handle) {
                router = require("../bootstrap/index").router;
                handle = require("../handlers/http-route").getRouteHandler;
            }
            router.method(method, path, handle(route), true);
        };
    }
    else {
        let proto = (args.length == 4 ? args[2] : args[1]).prototype, method = args.length == 4 ? args[3] : args[2];
        return _route(route)(proto, method);
    }
}
exports.route = _route;
exports.route.delete = function (...args) {
    return _route("DELETE", ...args);
};
exports.route.get = function (...args) {
    return _route("GET", ...args);
};
exports.route.head = function (...args) {
    return _route("HEAD", ...args);
};
exports.route.patch = function (...args) {
    return _route("PATCH", ...args);
};
exports.route.post = function (...args) {
    return _route("POST", ...args);
};
exports.route.put = function (...args) {
    return _route("PUT", ...args);
};
//# sourceMappingURL=functions.js.map