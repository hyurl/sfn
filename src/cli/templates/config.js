const Session = require("express-session");
const FileStore = require("session-file-store");

const Store = FileStore(Session);

var config = {
    env: process.env.NODE_ENV || "dev",
    workers: ["A"],
    bluebird: false,
    lang: "en-US",
    enableDocRoute: true,
    awaitGenerator: false,
    statics: [process.cwd() + "/src/assets"],
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
        store: new Store(),
        cookie: {
            secure: true
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

exports.config = config;