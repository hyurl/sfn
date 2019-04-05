import "sfn";

app.config.server.rpc = {
    "doc-server": {
        host: "localhost",
        port: 4001,
        modules: [app.services.docs, app.services.test]
    },
    "schedule-server": {
        host: "localhost",
        port: 4002,
        modules: [app.services.schedule]
    }
};