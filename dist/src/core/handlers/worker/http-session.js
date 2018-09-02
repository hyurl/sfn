"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExpressSession = require("express-session");
const ConfigLoader_1 = require("../../bootstrap/ConfigLoader");
const index_1 = require("../../bootstrap/index");
exports.session = ExpressSession(ConfigLoader_1.config.session);
index_1.app.use(exports.session).use((req, res, next) => {
    let _end = res.end;
    res.end = function end(...args) {
        res.sent = true;
        _end.apply(res, args);
    };
    next();
});
//# sourceMappingURL=http-session.js.map