export default <app.Config>{
    lang: "en-US",
    saveSchedules: false,
    statics: ["assets"],
    watch: [],
    server: {
        hostname: "localhost",
        http: {
            type: "http",
            port: 4000,
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