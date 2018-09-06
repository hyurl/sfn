"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Session = require("express-session");
const sessionFileStore = require("session-file-store");
const init_1 = require("./init");
;
const FileStore = sessionFileStore(Session);
exports.config = {
    env: process.env.NODE_ENV || "dev",
    lang: process.env.LANG || "en-US",
    enableDocRoute: false,
    awaitGenerator: false,
    workers: ["A"],
    statics: [init_1.SRC_PATH + "/assets"],
    watches: ["index.ts", "config.ts", "bootstrap", "controllers", "locales", "models"],
    server: {
        hostname: "localhost",
        timeout: 120000,
        autoStart: true,
        http: {
            type: process.env.HTTP_TYPE || "http",
            port: parseInt(process.env.HTTP_PORT) || 80,
            options: null
        },
        websocket: {
            enabled: true,
            port: undefined,
            options: {
                pingTimeout: 5000,
                pingInterval: 5000
            },
        },
        dgram: {
            enabled: true,
            port: 666
        },
        error: {
            show: true,
            log: true,
        }
    },
    database: {
        type: process.env.DB_TYPE || "mysql",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT) || 3306,
        database: process.env.DB_NAME || "sfn",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASS || "123456"
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
        host: process.env.MAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.MAIL_PORT) || 25,
        secure: false,
        from: process.env.MAIL_FROM || "",
        auth: {
            username: process.env.MAIL_USER || "",
            password: process.env.MAIL_PASS || ""
        }
    },
    redis: {
        host: process.env.REDIS_HOST || "",
        port: parseInt(process.env.REDIS_PORT) || undefined
    }
};
//# sourceMappingURL=config.js.map