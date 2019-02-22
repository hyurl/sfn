"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alar_ejs_loader_1 = require("alar-ejs-loader");
const Session = require("express-session");
const fileStore = require("session-file-store");
const get = require("lodash/get");
const FileStore = fileStore(Session);
const maxAge = get(app.config, "session.cookie.maxAge");
app.views.setLoader(new alar_ejs_loader_1.EjsLoader());
app.config.session.store = new FileStore({
    path: app.ROOT_PATH + "/sessions",
    ttl: maxAge ? Math.round(maxAge / 1000) : (24 * 3600)
});
//# sourceMappingURL=http.js.map