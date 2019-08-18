import "sfn";

app.config.server.rpc = {
    "doc-server": {
        host: "localhost",
        port: 4001,
        services: [app.services.docs, app.services.test],
        dependencies: [app.services.logger, app.services.schedule]
    },
    "logger-server": {
        host: "localhost",
        port: 4002,
        services: [app.services.logger]
    },
    "schedule-server": {
        host: "localhost",
        port: 4003,
        services: [app.services.schedule]
    },
    "cache-server": {
        host: "localhost",
        port: 4004,
        services: [app.services.cache]
    }
};