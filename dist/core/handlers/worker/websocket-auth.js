"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../bootstrap/index");
const UserLoader_1 = require("../../bootstrap/UserLoader");
index_1.ws ? index_1.ws.use(handler) : null;
index_1.wss ? index_1.wss.use(handler) : null;
function handler(socket, next) {
    socket.user = null;
    if (socket.session && socket.session.uid) {
        UserLoader_1.User.use(socket.db)
            .get(socket.session.uid)
            .then((user) => {
            socket.user = user;
            next();
        }).catch((err) => {
            next(err);
        });
    }
    else {
        next();
    }
}
//# sourceMappingURL=websocket-auth.js.map