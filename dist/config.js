"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Session = require("express-session");
const FileStore = require("session-file-store");
;
var Store = FileStore(Session);
exports.SFNConfig = {
    env: process.env.NODE_ENV || "dev",
    workers: ["A"],
    bluebird: false,
    lang: "en-US",
    enableDocRoute: false,
    awaitGenerator: false,
    statics: [process.cwd() + "/src/assets"],
    server: {
        hostname: "localhost",
        timeout: 120000,
        autoStart: false,
        http: {
            enabled: true,
            port: 80
        },
        https: {
            enabled: false,
            port: 443,
            forceRedirect: true,
            credentials: null
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
        secure: true,
        unset: "destroy",
        store: new Store()
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
//# sourceMappingURL=config.js.map