"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const ExpressSession = require("express-session");
const function_intercepter_1 = require("function-intercepter");
const ConfigLoader_1 = require("../../bootstrap/ConfigLoader");
const index_1 = require("../../bootstrap/index");
exports.session = ExpressSession(ConfigLoader_1.config.session);
index_1.app.use(exports.session).use((req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    res.sent = false;
    res.end = function_intercepter_1.intercept(res.end).before(() => {
        res.sent = true;
    });
    yield next();
}));
//# sourceMappingURL=http-session.js.map