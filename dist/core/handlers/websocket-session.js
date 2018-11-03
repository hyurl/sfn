"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const http_session_1 = require("./http-session");
function default_1(socket, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        http_session_1.session(socket.handshake, {}, next);
    });
}
exports.default = default_1;
function handler2(socket, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        socket.session = new Proxy(socket.handshake["session"], {
            set: (session, key, value) => {
                session[key] = value;
                return true;
            },
            get: (session, key) => session[key],
            has: (session, key) => key in session,
            deleteProperty: (session, key) => delete session[key]
        });
        socket.on("disconnected", () => {
            socket.session.save(() => { });
        });
        next();
    });
}
exports.handler2 = handler2;
//# sourceMappingURL=websocket-session.js.map