"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const load_user_1 = require("../bootstrap/load-user");
async function default_1(socket, next) {
    socket.user = null;
    if (socket.session && socket.session.uid) {
        try {
            socket.user = await load_user_1.User.use(socket.db).get(socket.session.uid);
        }
        catch (e) { }
    }
    await next();
}
exports.default = default_1;
//# sourceMappingURL=websocket-auth.js.map