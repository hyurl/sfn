import { SFNConfig, SRC_PATH, ROOT_PATH } from "sfn";
import * as Session from "express-session";
import * as sessionFileStore from "session-file-store";

const FileStore = sessionFileStore(Session);
const env = process.env;

export const config: SFNConfig = {
    env: <SFNConfig["env"]>process.env.NODE_ENV || "dev",
    lang: process.env.LANG || "en-US",
    enableDocRoute: false,
    awaitGenerator: false,
    workers: env.WORKERS ? env.WORKERS.split(/,\s*/) : ["A", "B"],
    statics: [SRC_PATH + "/assets"],
    watches: ["index.ts", "config.ts", "bootstrap", "controllers", "locales", "models"],
    controllers: env.CONTROLLERS ? env.CONTROLLERS.split(/,\s*/) : ["controllers"],
    hotReloading: false,
    server: {
        hostname: "localhost",
        timeout: 120000, // 2 min.
        autoStart: true,
        http: {
            type: <SFNConfig["server"]["http"]["type"]>process.env.HTTP_PORT || "http",
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
        host: process.env.DB_HOST ||  "localhost",
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
            path: ROOT_PATH + "/sessions",
            ttl: 3600 * 24 // 24 hours (in seconds)
        }),
        cookie: {
            maxAge: 3600 * 24 * 1000 // 24 hours (in milliseconds)
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