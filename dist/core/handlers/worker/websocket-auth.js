"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const UserLoader_1 = require("../../bootstrap/UserLoader");
function default_1(socket, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        socket.user = null;
        if (socket.session && socket.session.uid) {
            try {
                socket.user = (yield UserLoader_1.User.use(socket.db).get(socket.session.uid));
            }
            catch (e) { }
        }
        yield next();
    });
}
exports.default = default_1;
//# sourceMappingURL=websocket-auth.js.map