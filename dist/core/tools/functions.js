"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const RouteMap_1 = require("./RouteMap");
const EventMap_1 = require("./EventMap");
tslib_1.__exportStar(require("capitalization"), exports);
tslib_1.__exportStar(require("sfn-xss"), exports);
function rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.rand = rand;
function randStr(length = 5, chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    var str = "", max = chars.length - 1;
    for (let i = 0; i < length; i++) {
        str += chars[rand(0, max)];
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
function event(...args) {
    if (args.length === 1) {
        return (proto, prop) => {
            EventMap_1.EventMap[args[0]] = {
                Class: proto.constructor,
                method: prop
            };
        };
    }
    else {
        EventMap_1.EventMap[args[0]] = {
            Class: args[1],
            method: args[2]
        };
    }
}
exports.event = event;
function upload(...fields) {
    return (proto, prop) => {
        let Class = proto.constructor;
        if (!Class.hasOwnProperty("UploadFields"))
            Class.UploadFields = {};
        Class.UploadFields[prop] = fields;
    };
}
exports.upload = upload;
exports.requireAuth = (proto, prop) => {
    let Class = proto.constructor;
    if (!Class.hasOwnProperty("UploadFields"))
        Class.RequireAuth = [];
    if (!Class.RequireAuth.includes(prop))
        Class.RequireAuth.push(prop);
};
function _route(...args) {
    let route = args.length % 2 ? args[0] : `${args[0]} ${args[1]}`;
    if (args.length === 1 || args.length === 2) {
        return (proto, prop) => {
            RouteMap_1.RouteMap[route] = {
                Class: proto.constructor,
                method: prop
            };
        };
    }
    else {
        RouteMap_1.RouteMap[route] = {
            Class: args.length === 4 ? args[2] : args[1],
            method: args.length === 4 ? args[3] : args[2]
        };
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