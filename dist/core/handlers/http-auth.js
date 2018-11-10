"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = require("../bootstrap/index");
const UserLoader_1 = require("../bootstrap/UserLoader");
index_1.app.use((req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    req.user = null;
    if (req.session && req.session.uid) {
        try {
            req.user = (yield UserLoader_1.User.use(req.db).get(req.session.uid));
        }
        catch (e) { }
    }
    yield next();
}));
//# sourceMappingURL=http-auth.js.map