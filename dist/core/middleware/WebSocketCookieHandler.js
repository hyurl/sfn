"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cookieParser = require("cookie-parser");
const init_1 = require("../../init");
const parser = cookieParser(init_1.config.session.secret);
function handleWebSocketCookie(io) {
    io.use((socket, next) => {
        parser(socket.handshake, {}, next);
    }).use((socket, next) => {
        socket.cookies = socket.handshake["cookies"];
        next();
    });
}
exports.handleWebSocketCookie = handleWebSocketCookie;
//# sourceMappingURL=WebSocketCookieHandler.js.map