"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const session_1 = require("../bootstrap/session");
function handleWebSocketSession(io) {
    io.use((socket, next) => {
        session_1.session(socket.handshake, {}, next);
    }).use((socket, next) => {
        socket.session = new Proxy(socket.handshake["session"], {
            set: (session, key, value) => {
                session[key] = value;
                return true;
            },
            get: (session, key) => session[key],
            has: (session, key) => key in session,
            deleteProperty: (session, key) => delete session[key]
        });
        next();
    });
}
exports.handleWebSocketSession = handleWebSocketSession;
//# sourceMappingURL=WebSocketSessionHandler.js.map