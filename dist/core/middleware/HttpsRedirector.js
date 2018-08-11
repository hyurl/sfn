"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
function redirectHttps(app) {
    if (ConfigLoader_1.config.server.https.enabled && ConfigLoader_1.config.server.https.forceRedirect) {
        app.use((req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (req.protocol !== "https") {
                let host = req.hostname + ":" + ConfigLoader_1.config.server.https.port;
                res.redirect(`https://${host}${req.url}`, 301);
            }
            else {
                yield next();
            }
        }));
    }
}
exports.redirectHttps = redirectHttps;
//# sourceMappingURL=HttpsRedirector.js.map