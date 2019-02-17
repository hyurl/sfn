"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../bootstrap/index");
const load_user_1 = require("../bootstrap/load-user");
index_1.router.use(async (req, res, next) => {
    req.user = null;
    if (req.session && req.session.uid) {
        try {
            req.user = await load_user_1.loadUser().use(req.db).get(req.session.uid);
        }
        catch (e) { }
    }
    await next();
});
//# sourceMappingURL=http-auth.js.map