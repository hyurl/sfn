export default <app.Config>{
    lang: "en-US",
    statics: ["assets"],
    hotReloading: true,
    server: {
        hostname: "localhost",
        http: {
            type: process.env.HTTP_TYPE || "http",
            port: parseInt(process.env.HTTP_PORT) || 80,
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
        name: "sid",
        resave: true,
        saveUninitialized: true,
        unset: "destroy",
        cookie: {
            maxAge: 3600 * 24 * 1000 // 24 hours (in milliseconds)
        }
    }
};