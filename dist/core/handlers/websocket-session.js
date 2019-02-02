"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_session_1 = require("./http-session");
async function default_1(socket, next) {
    http_session_1.session(socket.handshake, {}, next);
}
exports.default = default_1;
async function handler2(socket, next) {
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
}
exports.handler2 = handler2;
//# sourceMappingURL=websocket-session.js.map