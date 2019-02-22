import { EjsLoader } from "alar-ejs-loader";
import * as Session from "express-session";
import fileStore = require("session-file-store");
import get = require("lodash/get");

const FileStore = fileStore(Session);
const maxAge: number = get(app.config, "session.cookie.maxAge");

app.views.setLoader(new EjsLoader());
app.config.session.store = new FileStore({
    path: app.ROOT_PATH + "/sessions",
    ttl: maxAge ? Math.round(maxAge / 1000) : (24 * 3600)
});