"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cookieParser = require("cookie-parser");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
const parser = cookieParser(ConfigLoader_1.config.session.secret);
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