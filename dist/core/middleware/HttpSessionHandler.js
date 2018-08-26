"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExpressSession = require("express-session");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
exports.session = ExpressSession(ConfigLoader_1.config.session);
function handleHttpSession(app) {
    app.use(exports.session).use((req, res, next) => {
        let _end = res.end;
        res.end = function end(...args) {
            res.sent = true;
            _end.apply(res, args);
        };
        next();
    });
}
exports.handleHttpSession = handleHttpSession;
//# sourceMappingURL=HttpSessionHandler.js.map