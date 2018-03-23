"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserLoader_1 = require("../bootstrap/UserLoader");
function handleWebSocketAuth(io) {
    io.use((socket, next) => {
        socket.user = null;
        if (socket.session && socket.session.uid) {
            UserLoader_1.User.use(socket.db)
                .get(socket.session.uid)
                .then((user) => {
                socket.user = user;
                next();
            }).catch(() => {
                next();
            });
        }
        else {
            next();
        }
    });
}
exports.handleWebSocketAuth = handleWebSocketAuth;
//# sourceMappingURL=WebSocketAuthHandler.js.map