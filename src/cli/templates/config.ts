import { SFNConfig, SRC_PATH, ROOT_PATH } from "sfn";
import * as Session from "express-session";
import * as sessionFileStore from "session-file-store";

const FileStore = sessionFileStore(Session);

export var config: SFNConfig = {
    env: process.env.NODE_ENV || "pro",
    workers: ["A"],
    bluebird: false,
    lang: "en-US",
    enableDocRoute: false,
    awaitGenerator: false,
    statics: [SRC_PATH + "/assets"],
    watches: ["index.ts", "config.ts", "bootstrap", "controllers", "locales", "models"],
    server: {
        hostname: "localhost",
        timeout: 120000,
        autoStart: true,
        http: {
            enabled: true,
            port: 80
        },
        https: {
            enabled: false,
            port: 443,
            forceRedirect: true,
            options: null,
            http2: false
        },
        websocket: {
            enabled: true,
            options: {
                pingTimeout: 5000,
                pingInterval: 5000
            },
        },
        error: {
            show: true,
            log: true,
        }
    },
    database: {
        type: "mysql",
        host: "localhost",
        port: 3306,
        database: "modelar",
        user: "root",
        password: "161301"
    },
    session: {
        secret: "sfn",
        name: "sfn-sid",
        resave: true,
        saveUninitialized: true,
        unset: "destroy",
        store: new FileStore({
            path: ROOT_PATH + "/sessions",
            ttl: 3600 * 24 // 24 hours (in seconds)
        }),
        cookie: {
            maxAge: 3600 * 24 * 1000 // 24 hours (in milliseconds)
        }
    },
    mail: {
        pool: false,
        host: "",
        port: 25,
        secure: false,
        from: "",
        auth: {
            username: "",
            password: ""
        }
    },
    redis: {
        host: null,
        port: null
    }
};