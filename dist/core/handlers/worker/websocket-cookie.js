"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cookieParser = require("cookie-parser");
const ConfigLoader_1 = require("../../bootstrap/ConfigLoader");
const index_1 = require("../../bootstrap/index");
index_1.ws ? index_1.ws.use(handler).use(handler2) : null;
const parser = cookieParser(ConfigLoader_1.config.session.secret);
function handler(socket, next) {
    parser(socket.handshake, {}, next);
}
function handler2(socket, next) {
    socket.cookies = socket.handshake["cookies"];
    next();
}
//# sourceMappingURL=websocket-cookie.js.map