"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../bootstrap/index");
const http_session_1 = require("./http-session");
index_1.ws ? index_1.ws.use(handler).use(handler2) : null;
index_1.wss ? index_1.wss.use(handler).use(handler2) : null;
function handler(socket, next) {
    http_session_1.session(socket.handshake, {}, next);
}
function handler2(socket, next) {
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
//# sourceMappingURL=websocket-session.js.map