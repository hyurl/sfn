"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cookieParser = require("cookie-parser");
const load_config_1 = require("../bootstrap/load-config");
const parser = cookieParser(load_config_1.config.session.secret);
async function default_1(socket, next) {
    parser(socket.handshake, {}, next);
}
exports.default = default_1;
async function handler2(socket, next) {
    socket.cookies = socket.handshake["cookies"];
    await next();
}
exports.handler2 = handler2;
//# sourceMappingURL=websocket-cookie.js.map