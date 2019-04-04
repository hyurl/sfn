import "sfn";

app.config.server.rpc = {
    "doc-server": {
        host: "localhost",
        port: 8000,
        modules: [app.services.docs, app.services.test]
    },
    "schedule-server": {
        host: "localhost",
        port: 8001,
        modules: [app.services.schedule]
    }
};