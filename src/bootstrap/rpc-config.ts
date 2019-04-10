import "sfn";

app.config.server.rpc = {
    "doc-server": {
        host: "localhost",
        port: 4001,
        modules: [app.services.docs, app.services.test]
    },
    "logger-server": {
        host: "localhost",
        port: 4002,
        modules: [app.services.logger]
    },
    "schedule-server": {
        host: "localhost",
        port: 4003,
        modules: [app.services.schedule]
    },
    "cache-server": {
        host: "localhost",
        port: 4004,
        modules: [app.services.cache]
    }
};