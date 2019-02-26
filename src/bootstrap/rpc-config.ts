import { config } from "../core/bootstrap/load-config";
import "../core/bootstrap/load-services";

config.server.rpc = {
    "doc-server": {
        path: app.SRC_PATH + "/cache/app.sock",
        modules: [app.services.docs]
    }
};