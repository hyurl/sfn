"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExpressSession = require("express-session");
const function_intercepter_1 = require("function-intercepter");
const load_config_1 = require("../bootstrap/load-config");
const index_1 = require("../bootstrap/index");
exports.session = ExpressSession(load_config_1.config.session);
index_1.router.use(exports.session).use(async (req, res, next) => {
    res.sent = false;
    res.end = function_intercepter_1.intercept(res.end).before(() => {
        res.sent = true;
    });
    await next();
});
//# sourceMappingURL=http-session.js.map