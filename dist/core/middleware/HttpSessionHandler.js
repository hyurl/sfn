"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const session_1 = require("../bootstrap/session");
function handleHttpSession(app) {
    app.use((req, res, next) => {
        session_1.session(req, {}, (err) => {
            if (err)
                throw err;
            let hash = session_1.getHash(req.session), handler = () => {
                if (hash !== session_1.getHash(req.session)) {
                    req.session.touch(null);
                    req.session.save(err => {
                        if (err)
                            throw err;
                    });
                }
            };
            res.on("finish", handler).on("close", handler);
            next();
        });
    });
}
exports.handleHttpSession = handleHttpSession;
//# sourceMappingURL=HttpSessionHandler.js.map