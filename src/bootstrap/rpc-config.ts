import { config } from "../core/bootstrap/load-config";
import "../core/bootstrap/load-services";

config.server.rpc = {
    "doc-server": {
        host: "localhost",
        port: 8000,
        modules: [app.services.docs]
    }
};