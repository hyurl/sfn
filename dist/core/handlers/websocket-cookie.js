"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const cookieParser = require("cookie-parser");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
const parser = cookieParser(ConfigLoader_1.config.session.secret);
function default_1(socket, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        parser(socket.handshake, {}, next);
    });
}
exports.default = default_1;
function handler2(socket, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        socket.cookies = socket.handshake["cookies"];
        yield next();
    });
}
exports.handler2 = handler2;
//# sourceMappingURL=websocket-cookie.js.map