"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HttpSessionHandler_1 = require("./HttpSessionHandler");
function handleWebSocketSession(io) {
    io.use((socket, next) => {
        HttpSessionHandler_1.session(socket.handshake, {}, next);
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
        socket.on("disconnected", () => {
            socket.session.save(() => { });
        });
        next();
    });
}
exports.handleWebSocketSession = handleWebSocketSession;
//# sourceMappingURL=WebSocketSessionHandler.js.map