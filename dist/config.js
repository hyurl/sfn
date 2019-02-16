"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Session = require("express-session");
const sessionFileStore = require("session-file-store");
const init_1 = require("./init");
;
const FileStore = sessionFileStore(Session);
const env = process.env;
exports.config = {
    lang: env.LANG || "en-US",
    statics: ["assets"],
    hotReloading: true,
    server: {
        hostname: "localhost",
        http: {
            type: env.HTTP_TYPE || "http",
            port: parseInt(env.HTTP_PORT) || 80,
            timeout: 120000,
            options: null
        },
        websocket: {
            enabled: true,
            port: undefined,
            options: {
                pingTimeout: 5000,
                pingInterval: 5000
            },
        }
    },
    database: {
        type: env.DB_TYPE || "mysql",
        host: env.DB_HOST || "localhost",
        port: parseInt(env.DB_PORT) || 3306,
        database: env.DB_NAME || "sfn",
        user: env.DB_USER || "root",
        password: env.DB_PASS || "123456"
    },
    session: {
        secret: "sfn",
        name: "sfn-sid",
        resave: true,
        saveUninitialized: true,
        unset: "destroy",
        store: new FileStore({
            path: init_1.ROOT_PATH + "/sessions",
            ttl: 3600 * 24
        }),
        cookie: {
            maxAge: 3600 * 24 * 1000
        }
    },
    mail: {
        pool: false,
        host: env.MAIL_HOST || "smtp.gmail.com",
        port: parseInt(env.MAIL_PORT) || 25,
        secure: false,
        from: env.MAIL_FROM || "",
        auth: {
            username: env.MAIL_USER || "",
            password: env.MAIL_PASS || ""
        }
    }
};
//# sourceMappingURL=config.js.map