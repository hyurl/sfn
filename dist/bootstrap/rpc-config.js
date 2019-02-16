"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const load_config_1 = require("../core/bootstrap/load-config");
load_config_1.config.server.rpc = {
    "doc-server": {
        host: "127.0.0.1",
        port: 8081,
        modules: [app.services.docs]
    }
};
//# sourceMappingURL=rpc-config.js.map