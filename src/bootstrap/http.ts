import { EjsLoader } from "alar-ejs-loader";
import * as Session from "express-session";
import fileStore = require("session-file-store");
import get = require("lodash/get");
import { HttpController } from "sfn";

const FileStore = fileStore(Session);
const maxAge: number = get(app.config, "session.cookie.maxAge");

app.views.setLoader(new EjsLoader());
app.config.session.store = new FileStore({
    path: app.ROOT_PATH + "/sessions",
    ttl: maxAge ? Math.round(maxAge / 1000) : (24 * 3600)
});

HttpController.httpErrorView = function (err, instance) {
    return instance.view("error", { err, port: app.config.server.http.port });
}

// correct langauge name
app.router.use(async (req, res) => {
    let names = req.lang.split("-");

    if (names.length > 1) {
        req.lang = names[0] + "-" + names[1].toUpperCase();
    }
});