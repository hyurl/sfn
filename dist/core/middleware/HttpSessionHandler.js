"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const session_1 = require("../bootstrap/session");
function handleHttpSession(app) {
    app.use(session_1.session);
}
exports.handleHttpSession = handleHttpSession;
//# sourceMappingURL=HttpSessionHandler.js.map