import { config } from "../core/bootstrap/load-config";

config.server.rpc = {
    "doc-server": {
        host: "127.0.0.1",
        port: 8081,
        modules: [app.services.docs]
    }
};