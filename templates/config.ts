const env = process.env;

export default <app.Config>{
    lang: "en-US",
    statics: ["assets"],
    hotReloading: true,
    server: {
        hostname: "localhost",
        http: {
            type: <app.Config["server"]["http"]["type"]>env.HTTP_TYPE || "http",
            port: parseInt(env.HTTP_PORT) || 80,
            timeout: 120000, // 2 min.
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
        rpc: {}
    },
    session: {
        secret: "sfn",
        name: "sfn-sid",
        resave: true,
        saveUninitialized: true,
        unset: "destroy",
        cookie: {
            maxAge: 3600 * 24 * 1000 // 24 hours (in milliseconds)
        }
    },
    database: {
        type: env.DB_TYPE || "mysql",
        host: env.DB_HOST || "localhost",
        port: parseInt(env.DB_PORT) || 3306,
        database: env.DB_NAME || "sfn",
        user: env.DB_USER || "root",
        password: env.DB_PASS || "123456"
    }
};