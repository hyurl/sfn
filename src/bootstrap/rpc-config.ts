import { config } from "../core/bootstrap/load-config";
import "../core/bootstrap/load-services";
import "../core/bootstrap/load-schedule";

config.server.rpc = {
    "doc-server": {
        host: "localhost",
        port: 8000,
        modules: [app.services.docs]
    },
    "schedule-server": {
        host: "localhost",
        port: 8001,
        modules: [app.services.schedule]
    }
};