"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dgram = require("dgramx");
const es6_promisify_1 = require("es6-promisify");
const pidusage = require("pidusage");
const values = require("lodash/values");
const random = require("lodash/random");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
const functions_inner_1 = require("./functions-inner");
const RouteMap_1 = require("./RouteMap");
const EventMap_1 = require("./EventMap");
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
exports.requireAuth = (proto, prop) => {
    if (!proto.Class.hasOwnProperty("RequireAuth"))
        proto.Class.RequireAuth = [];
    if (!proto.Class.RequireAuth.includes(prop))
        proto.Class.RequireAuth.push(prop);
};
function event(name, Class, method) {
    if (arguments.length === 1) {
        return (proto, prop) => {
            let nsp = proto.Class.nsp || "/";
            if (!EventMap_1.EventMap[nsp])
                EventMap_1.EventMap[nsp] = {};
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
let app, handle;
function _route(...args) {
    let route = args.length % 2 ? args[0] : `${args[0]} ${args[1]}`;
    if (args.length <= 2) {
        return (proto, prop) => {
            RouteMap_1.RouteMap[route] = {
                Class: proto.Class,
                method: prop
            };
            let __route = route.split(/\s+/), method = _route[0] === "SSE" ? "GET" : __route[0], path = (proto.Class.baseURI || "") + __route[1];
            app = app || (app = require("../bootstrap/index").app);
            handle = handle || (handle = require("../handlers/worker/http-route").getRouteHandler);
            app.method(method, path, handle(route), true);
        };
    }
    else {
        let proto = args.length == 4 ? args[2] : args[1], method = args.length == 4 ? args[3] : args[2];
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
let intercepterWarning = "Using `@before()` and `@after()` decorators is deprecated, please install `function-intercepter` module instead.";
let intercepterWarned = false;
let tryWarnDeprecation = () => {
    if (!intercepterWarned) {
        process.emitWarning(intercepterWarning, "DeprecationWarning");
        intercepterWarned = true;
    }
};
function before(fn) {
    tryWarnDeprecation();
    return (proto, prop) => {
        if (!proto.Class.hasOwnProperty("BeforeIntercepters")) {
            proto.Class.BeforeIntercepters = {};
        }
        if (proto.Class.BeforeIntercepters[prop] === undefined)
            proto.Class.BeforeIntercepters[prop] = [];
        proto.Class.BeforeIntercepters[prop].push(fn);
    };
}
exports.before = before;
function after(fn) {
    tryWarnDeprecation();
    return (proto, prop) => {
        if (!proto.Class.hasOwnProperty("AfterIntercepters")) {
            proto.Class.AfterIntercepters = {};
        }
        if (proto.Class.AfterIntercepters[prop] === undefined)
            proto.Class.AfterIntercepters[prop] = [];
        proto.Class.AfterIntercepters[prop].push(fn);
    };
}
exports.after = after;
function getDgramClient() {
    let port = ConfigLoader_1.config.server.dgram.port;
    if (!ConfigLoader_1.config.server.dgram.enabled) {
        console.log(functions_inner_1.red `Datagram server isn't enabled!`);
        return null;
    }
    return dgram.createClient(`udp://127.0.0.1:${port}`);
}
exports.getDgramClient = getDgramClient;
function vol2str(num) {
    if (num > 1073741824) {
        return (num / 1073741824).toFixed(3) + " Gb";
    }
    else if (num > 1048576) {
        return (num / 1048576).toFixed(3) + " Mb";
    }
    else if (num > 1024) {
        return (num / 1024).toFixed(3) + " Kb";
    }
    else {
        return num + " b";
    }
}
exports.vol2str = vol2str;
function sec2str(sec) {
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
exports.sec2str = sec2str;
function notifyReload(timeout = 100, cb) {
    let client = getDgramClient();
    if (client) {
        client.bind(0);
        client.on("worker-reloaded", () => {
            console.log(functions_inner_1.green `Workers reloaded!`);
            client.close(() => {
                cb ? cb() : null;
            });
        }).emit("worker-reload", timeout, () => {
            console.log(functions_inner_1.grey `Reloading workers...`);
        });
    }
}
exports.notifyReload = notifyReload;
const pidusageAsync = es6_promisify_1.promisify(pidusage);
function listWorkers(cb, withMaster) {
    let client = getDgramClient();
    if (!client) {
        cb(new Error("Datagram server isn't enabled."), null, null);
    }
    let header = ["id", "pid", "state", "reboot", "uptime", "memory", "cpu"], body = [], timer = setTimeout(() => {
        client.removeAllListeners("worker-list");
        client.close();
        cb(new Error("Unable to fetch worker information."), null, null);
    }, 5000);
    client.bind(0);
    client.on("worker-listed", (workers) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        clearTimeout(timer);
        for (let worker of workers) {
            let stats = yield pidusageAsync(worker.pid);
            worker.uptime = sec2str(worker.uptime);
            body.push(values(worker).concat([
                vol2str(stats.memory),
                Math.round(stats.cpu) + " %"
            ]));
        }
        client.close(() => cb(null, header, body));
    })).emit("worker-list", withMaster);
}
exports.listWorkers = listWorkers;
//# sourceMappingURL=functions.js.map