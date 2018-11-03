import { SFNConfig, SRC_PATH, ROOT_PATH } from "sfn";
import * as Session from "express-session";
import * as sessionFileStore from "session-file-store";

const FileStore = sessionFileStore(Session);
const env = process.env;

export const config: SFNConfig = {
    env: <SFNConfig["env"]>env.NODE_ENV || "dev",
    lang: env.LANG || "en-US",
    enableDocRoute: false,
    awaitGenerator: false,
    statics: [SRC_PATH + "/assets"],
    controllers: env.CONTROLLERS ? env.CONTROLLERS.split(/,\s*/) : ["controllers"],
    hotReloading: false,
    server: {
        hostname: "localhost",
        timeout: 120000, // 2 min.
        autoStart: true,
        http: {
            type: <SFNConfig["server"]["http"]["type"]>env.HTTP_PORT || "http",
            port: parseInt(env.HTTP_PORT) || 80,
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
        error: {
            show: true,
            log: true,
        }
    },
    database: {
        type: env.DB_TYPE || "mysql",
        host: env.DB_HOST ||  "localhost",
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
            path: ROOT_PATH + "/sessions",
            ttl: 3600 * 24 // 24 hours (in seconds)
        }),
        cookie: {
            maxAge: 3600 * 24 * 1000 // 24 hours (in milliseconds)
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
    },
    redis: {
        host: env.REDIS_HOST || "",
        port: parseInt(env.REDIS_PORT) || undefined
    }
};