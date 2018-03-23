const { SFNConfig } = require("sfn");
const Session = require("express-session");
const FileStore = require("session-file-store");

const Store = FileStore(Session);

var config = {
    env: "dev",
    bluebird: false,
    lang: "en-US",
    enableDocRoute: true,
    workers: ["A"],
    staticPath: process.cwd() + "/src/assets",
    server: {
        host: "localhost",
        port: 80,
        timeout: 120000,
        autoStart: true,
        https: {
            enabled: false,
            port: 443,
            forceRedirect: true,
            credentials: null
        },
        socket: {
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

exports.config = config;